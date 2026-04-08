package com.blockedu.api;

import com.blockedu.core.Blockchain;
import com.blockedu.core.ProofOfWork;
import com.blockedu.model.Block;
import com.blockedu.util.HashUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;

public class BlockchainServer {

    private static Blockchain blockchain = new Blockchain(3);
    private static final Map<String, PrintWriter> miningStreams = new ConcurrentHashMap<>();
    private static final ExecutorService executor = Executors.newCachedThreadPool();

    public static void main(String[] args) throws Exception {
        int port = args.length > 0 ? Integer.parseInt(args[0]) : 8080;
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        // ── Routes ──
        server.createContext("/api/chain",        BlockchainServer::handleChain);
        server.createContext("/api/block/add",    BlockchainServer::handleAddBlock);
        server.createContext("/api/block/tamper", BlockchainServer::handleTamper);
        server.createContext("/api/block/restore",BlockchainServer::handleRestore);
        server.createContext("/api/mine/stream",  BlockchainServer::handleMineStream);
        server.createContext("/api/hash",         BlockchainServer::handleHash);
        server.createContext("/api/hash/steps",   BlockchainServer::handleHashSteps);
        server.createContext("/api/merkle",       BlockchainServer::handleMerkle);
        server.createContext("/api/difficulty",   BlockchainServer::handleDifficulty);
        server.createContext("/api/reset",        BlockchainServer::handleReset);
        server.createContext("/api/validate",     BlockchainServer::handleValidate);
        server.createContext("/health",           BlockchainServer::handleHealth);

        server.setExecutor(executor);
        server.start();
        System.out.println("[BlockEdu] Java Core running on port " + port);
        System.out.println("[BlockEdu] Blockchain initialized with difficulty=" + blockchain.getDifficulty());
    }

    // ── GET /api/chain ─────────────────────────────────────────────────────
    static void handleChain(HttpExchange ex) throws IOException {
        if (!allowCors(ex)) return;
        respond(ex, 200, blockchain.toJson());
    }

    // ── POST /api/block/add ────────────────────────────────────────────────
    static void handleAddBlock(HttpExchange ex) throws IOException {
        if (!allowCors(ex)) return;
        if (!"POST".equals(ex.getRequestMethod())) { respond(ex, 405, "{}"); return; }
        String body = readBody(ex);
        String data = extractJson(body, "data");
        String txsRaw = extractJsonArray(body, "transactions");
        List<String> txs = new ArrayList<>();
        if (!txsRaw.isEmpty()) {
            for (String t : txsRaw.split("\\|\\|")) {
                t = t.trim();
                if (!t.isEmpty()) txs.add(t);
            }
        }
        if (data == null || data.isEmpty()) data = "Block " + blockchain.size();
        Block added = blockchain.addBlock(data, txs);
        respond(ex, 200, "{\"success\":true,\"block\":" + added.toJson() + ",\"chain\":" + blockchain.toJson() + "}");
    }

    // ── POST /api/block/tamper ─────────────────────────────────────────────
    static void handleTamper(HttpExchange ex) throws IOException {
        if (!allowCors(ex)) return;
        if (!"POST".equals(ex.getRequestMethod())) { respond(ex, 405, "{}"); return; }
        String body = readBody(ex);
        int index = Integer.parseInt(extractJson(body, "index"));
        String newData = extractJson(body, "data");
        boolean ok = blockchain.tamperBlock(index, newData);
        respond(ex, 200, "{\"success\":" + ok + ",\"chain\":" + blockchain.toJson() + "}");
    }

    // ── POST /api/block/restore ────────────────────────────────────────────
    static void handleRestore(HttpExchange ex) throws IOException {
        if (!allowCors(ex)) return;
        if (!"POST".equals(ex.getRequestMethod())) { respond(ex, 405, "{}"); return; }
        String body = readBody(ex);
        int index = Integer.parseInt(extractJson(body, "index"));
        blockchain.restoreBlock(index);
        respond(ex, 200, "{\"success\":true,\"chain\":" + blockchain.toJson() + "}");
    }

    // ── GET /api/mine/stream?index=N ──────────────────────────────────────
    // Server-Sent Events streaming mining progress
    static void handleMineStream(HttpExchange ex) throws IOException {
        if (!allowCors(ex)) return;
        String query = ex.getRequestURI().getQuery();
        int index = 1;
        if (query != null && query.startsWith("index=")) {
            try { index = Integer.parseInt(query.split("=")[1]); } catch (Exception ignored) {}
        }
        final int blockIndex = index;

        ex.getResponseHeaders().set("Content-Type", "text/event-stream");
        ex.getResponseHeaders().set("Cache-Control", "no-cache");
        ex.getResponseHeaders().set("Connection", "keep-alive");
        ex.sendResponseHeaders(200, 0);

        Block block = blockchain.getBlock(blockIndex);
        if (block == null) {
            try (OutputStream os = ex.getResponseBody()) {
                os.write("data: {\"error\":\"Block not found\"}\n\n".getBytes());
            }
            return;
        }

        // Reset block nonce and hash for re-mining
        block.setNonce(0);
        Block prev = blockchain.getBlock(blockIndex - 1);
        if (prev != null) block.setPreviousHash(prev.getHash());

        OutputStream os = ex.getResponseBody();
        PrintWriter writer = new PrintWriter(new OutputStreamWriter(os, StandardCharsets.UTF_8), true);

        int difficulty = blockchain.getDifficulty();
        String target = "0".repeat(difficulty);
        long start = System.currentTimeMillis();
        int[] nonceRef = {0};
        boolean[] found = {false};

        try {
            while (nonceRef[0] < ProofOfWork.MAX_ATTEMPTS) {
                block.setNonce(nonceRef[0]);
                String hash = block.calculateHash();

                if (nonceRef[0] % 100 == 0 || hash.startsWith(target)) {
                    long elapsed = System.currentTimeMillis() - start;
                    String event = String.format(
                        "data: {\"nonce\":%d,\"hash\":\"%s\",\"elapsed\":%d,\"found\":%b,\"target\":\"%s\"}\n\n",
                        nonceRef[0], hash, elapsed, hash.startsWith(target), target
                    );
                    writer.print(event);
                    writer.flush();
                    if (os.equals(System.out)) break; // safeguard
                }

                if (hash.startsWith(target)) {
                    block.setHash(hash);
                    block.setTampered(false);
                    found[0] = true;
                    // Send final chain state
                    String done = "data: {\"done\":true,\"nonce\":" + nonceRef[0] +
                        ",\"hash\":\"" + hash + "\",\"elapsed\":" + (System.currentTimeMillis()-start) +
                        ",\"chain\":" + blockchain.toJson() + "}\n\n";
                    writer.print(done);
                    writer.flush();
                    break;
                }
                nonceRef[0]++;
            }
        } catch (Exception e) {
            // Client disconnected
        } finally {
            try { os.close(); } catch (Exception ignored) {}
        }
    }

    // ── POST /api/hash ─────────────────────────────────────────────────────
    static void handleHash(HttpExchange ex) throws IOException {
        if (!allowCors(ex)) return;
        if (!"POST".equals(ex.getRequestMethod())) { respond(ex, 405, "{}"); return; }
        String body = readBody(ex);
        String input = extractJson(body, "input");
        if (input == null) input = "";
        String hash = HashUtil.sha256(input);
        respond(ex, 200, "{\"input\":\"" + escJson(input) + "\",\"hash\":\"" + hash + "\"}");
    }

    // ── POST /api/hash/steps ───────────────────────────────────────────────
    static void handleHashSteps(HttpExchange ex) throws IOException {
        if (!allowCors(ex)) return;
        if (!"POST".equals(ex.getRequestMethod())) { respond(ex, 405, "{}"); return; }
        String body = readBody(ex);
        String input = extractJson(body, "input");
        if (input == null) input = "";
        List<String> steps = HashUtil.sha256Steps(input);
        StringBuilder sb = new StringBuilder("{\"steps\":[");
        for (int i = 0; i < steps.size(); i++) {
            sb.append("\"").append(escJson(steps.get(i))).append("\"");
            if (i < steps.size() - 1) sb.append(",");
        }
        sb.append("]}");
        respond(ex, 200, sb.toString());
    }

    // ── POST /api/merkle ───────────────────────────────────────────────────
    static void handleMerkle(HttpExchange ex) throws IOException {
        if (!allowCors(ex)) return;
        if (!"POST".equals(ex.getRequestMethod())) { respond(ex, 405, "{}"); return; }
        String body = readBody(ex);
        String txsRaw = extractJson(body, "transactions");
        List<String> txs = new ArrayList<>();
        if (txsRaw != null) {
            for (String t : txsRaw.split("\\|\\|")) {
                t = t.trim();
                if (!t.isEmpty()) txs.add(t);
            }
        }
        String treeJson = HashUtil.buildMerkleTreeJson(txs);
        respond(ex, 200, treeJson);
    }

    // ── POST /api/difficulty ───────────────────────────────────────────────
    static void handleDifficulty(HttpExchange ex) throws IOException {
        if (!allowCors(ex)) return;
        if (!"POST".equals(ex.getRequestMethod())) { respond(ex, 405, "{}"); return; }
        String body = readBody(ex);
        int d = Integer.parseInt(extractJson(body, "difficulty"));
        d = Math.max(1, Math.min(5, d));
        blockchain.setDifficulty(d);
        respond(ex, 200, "{\"difficulty\":" + d + "}");
    }

    // ── POST /api/reset ────────────────────────────────────────────────────
    static void handleReset(HttpExchange ex) throws IOException {
        if (!allowCors(ex)) return;
        if (!"POST".equals(ex.getRequestMethod())) { respond(ex, 405, "{}"); return; }
        int diff = blockchain.getDifficulty();
        blockchain = new Blockchain(diff);
        respond(ex, 200, "{\"success\":true,\"chain\":" + blockchain.toJson() + "}");
    }

    // ── GET /api/validate ──────────────────────────────────────────────────
    static void handleValidate(HttpExchange ex) throws IOException {
        if (!allowCors(ex)) return;
        boolean valid = blockchain.isChainValid();
        List<Boolean> validities = blockchain.getBlockValidities();
        StringBuilder sb = new StringBuilder("{\"valid\":" + valid + ",\"blockValidities\":[");
        for (int i = 0; i < validities.size(); i++) {
            sb.append(validities.get(i));
            if (i < validities.size() - 1) sb.append(",");
        }
        sb.append("]}");
        respond(ex, 200, sb.toString());
    }

    // ── GET /health ────────────────────────────────────────────────────────
    static void handleHealth(HttpExchange ex) throws IOException {
        if (!allowCors(ex)) return;
        respond(ex, 200, "{\"status\":\"ok\",\"version\":\"1.0\",\"difficulty\":" + blockchain.getDifficulty() + "}");
    }

    // ── Helpers ────────────────────────────────────────────────────────────
    private static boolean allowCors(HttpExchange ex) throws IOException {
        ex.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        ex.getResponseHeaders().set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        ex.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
        if ("OPTIONS".equals(ex.getRequestMethod())) {
            ex.sendResponseHeaders(204, -1);
            return false;
        }
        return true;
    }

    private static void respond(HttpExchange ex, int code, String body) throws IOException {
        ex.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        ex.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = ex.getResponseBody()) { os.write(bytes); }
    }

    private static String readBody(HttpExchange ex) throws IOException {
        try (InputStream is = ex.getRequestBody()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private static String extractJson(String json, String key) {
        // Simple key extraction for flat JSON
        String search = "\"" + key + "\"";
        int idx = json.indexOf(search);
        if (idx < 0) return "";
        int colon = json.indexOf(":", idx + search.length());
        if (colon < 0) return "";
        int start = colon + 1;
        while (start < json.length() && json.charAt(start) == ' ') start++;
        if (start >= json.length()) return "";
        char first = json.charAt(start);
        if (first == '"') {
            // string value — handle escaped quotes
            StringBuilder sb = new StringBuilder();
            int i = start + 1;
            while (i < json.length()) {
                char c = json.charAt(i);
                if (c == '\\' && i + 1 < json.length()) {
                    char next = json.charAt(i + 1);
                    if (next == '"') { sb.append('"'); i += 2; continue; }
                    if (next == 'n') { sb.append('\n'); i += 2; continue; }
                    if (next == '\\') { sb.append('\\'); i += 2; continue; }
                }
                if (c == '"') break;
                sb.append(c);
                i++;
            }
            return sb.toString();
        } else if (first == '[') {
            // array — return content as-is
            return "";
        } else {
            // number or bool
            int end = start;
            while (end < json.length() && json.charAt(end) != ',' && json.charAt(end) != '}') end++;
            return json.substring(start, end).trim();
        }
    }

    private static String extractJsonArray(String json, String key) {
        // Returns array elements joined by "||"
        String search = "\"" + key + "\"";
        int idx = json.indexOf(search);
        if (idx < 0) return "";
        int bracket = json.indexOf("[", idx);
        if (bracket < 0) return "";
        int depth = 0; int i = bracket;
        StringBuilder result = new StringBuilder();
        boolean inStr = false; boolean escaped = false;
        StringBuilder cur = new StringBuilder();
        i++; // skip '['
        while (i < json.length()) {
            char c = json.charAt(i);
            if (escaped) { cur.append(c); escaped = false; i++; continue; }
            if (c == '\\') { escaped = true; i++; continue; }
            if (c == '"') { inStr = !inStr; if (inStr) { /* skip */ } else {
                if (result.length() > 0) result.append("||");
                result.append(cur); cur = new StringBuilder();
            } i++; continue; }
            if (inStr) { cur.append(c); i++; continue; }
            if (c == ']') break;
            i++;
        }
        return result.toString();
    }

    private static String escJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
    }
}
