package com.blockedu.util;

import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;

public class HashUtil {

    public static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes("UTF-8"));
            StringBuilder hexStr = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexStr.append('0');
                hexStr.append(hex);
            }
            return hexStr.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 failed", e);
        }
    }

    /** Returns intermediate hash steps for visualization */
    public static List<String> sha256Steps(String input) {
        List<String> steps = new ArrayList<>();
        steps.add("INPUT: " + input);
        steps.add("BYTES: " + bytesToHex(input.getBytes()));
        String h = sha256(input);
        // Simulate partial SHA-256 rounds (simplified for education)
        steps.add("INIT_HASH: 6a09e667bb67ae853c6ef372a54ff53a510e527f9b05688c1f83d9ab5be0cd19");
        steps.add("ROUND_16: " + sha256(input + "r16").substring(0, 32) + "...");
        steps.add("ROUND_32: " + sha256(input + "r32").substring(0, 32) + "...");
        steps.add("ROUND_48: " + sha256(input + "r48").substring(0, 32) + "...");
        steps.add("ROUND_64: " + h.substring(0, 32) + "...");
        steps.add("FINAL: " + h);
        return steps;
    }

    /** Build Merkle tree and return root hash */
    public static String buildMerkleRoot(List<String> transactions) {
        if (transactions == null || transactions.isEmpty()) return "";
        if (transactions.size() == 1) return sha256(transactions.get(0));
        List<String> hashes = new ArrayList<>();
        for (String tx : transactions) hashes.add(sha256(tx));
        while (hashes.size() > 1) {
            List<String> next = new ArrayList<>();
            for (int i = 0; i < hashes.size(); i += 2) {
                String left = hashes.get(i);
                String right = (i + 1 < hashes.size()) ? hashes.get(i + 1) : left;
                next.add(sha256(left + right));
            }
            hashes = next;
        }
        return hashes.get(0);
    }

    /** Build full Merkle tree as JSON for visualization */
    public static String buildMerkleTreeJson(List<String> transactions) {
        if (transactions == null || transactions.isEmpty()) return "null";
        List<String> leafHashes = new ArrayList<>();
        for (String tx : transactions) leafHashes.add(sha256(tx));

        // Pad to even
        List<String> current = new ArrayList<>(leafHashes);
        if (current.size() % 2 == 1) current.add(current.get(current.size() - 1));

        List<List<String>> levels = new ArrayList<>();
        levels.add(0, leafHashes);

        List<String> working = current;
        while (working.size() > 1) {
            List<String> next = new ArrayList<>();
            for (int i = 0; i < working.size(); i += 2) {
                String l = working.get(i);
                String r = (i + 1 < working.size()) ? working.get(i + 1) : l;
                next.add(sha256(l + r));
            }
            levels.add(0, next);
            working = next;
        }

        StringBuilder sb = new StringBuilder();
        sb.append("{\"root\":\"").append(working.get(0)).append("\",");
        sb.append("\"levels\":[");
        for (int lvl = 0; lvl < levels.size(); lvl++) {
            sb.append("[");
            List<String> row = levels.get(lvl);
            for (int i = 0; i < row.size(); i++) {
                sb.append("\"").append(row.get(i)).append("\"");
                if (i < row.size() - 1) sb.append(",");
            }
            sb.append("]");
            if (lvl < levels.size() - 1) sb.append(",");
        }
        sb.append("],\"transactions\":[");
        for (int i = 0; i < transactions.size(); i++) {
            sb.append("{\"data\":\"").append(transactions.get(i).replace("\"","\\\""))
              .append("\",\"hash\":\"").append(leafHashes.get(i)).append("\"}");
            if (i < transactions.size() - 1) sb.append(",");
        }
        sb.append("]}");
        return sb.toString();
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(bytes.length, 8); i++) {
            sb.append(String.format("%02x", bytes[i]));
        }
        return sb.toString() + "...";
    }
}
