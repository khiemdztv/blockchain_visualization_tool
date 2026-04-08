package com.blockedu.model;

import com.blockedu.util.HashUtil;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class Block {
    private int index;
    private long timestamp;
    private String data;
    private String previousHash;
    private int nonce;
    private String hash;
    private String merkleRoot;
    private List<String> transactions;
    private boolean tampered;

    public Block(int index, String data, String previousHash) {
        this.index = index;
        this.timestamp = Instant.now().toEpochMilli();
        this.data = data;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.transactions = new ArrayList<>();
        this.tampered = false;
        this.merkleRoot = "";
        this.hash = calculateHash();
    }

    public String calculateHash() {
        return HashUtil.sha256(index + timestamp + data + previousHash + nonce + merkleRoot);
    }

    public void addTransaction(String tx) {
        transactions.add(tx);
        this.merkleRoot = HashUtil.buildMerkleRoot(transactions);
        this.hash = calculateHash();
    }

    // ─── Getters / Setters ───────────────────────────────────────────
    public int getIndex() { return index; }
    public long getTimestamp() { return timestamp; }
    public String getData() { return data; }
    public void setData(String data) { this.data = data; this.hash = calculateHash(); }
    public String getPreviousHash() { return previousHash; }
    public void setPreviousHash(String h) { this.previousHash = h; }
    public int getNonce() { return nonce; }
    public void setNonce(int nonce) { this.nonce = nonce; this.hash = calculateHash(); }
    public String getHash() { return hash; }
    public void setHash(String hash) { this.hash = hash; }
    public String getMerkleRoot() { return merkleRoot; }
    public void setMerkleRoot(String merkleRoot) { this.merkleRoot = merkleRoot; }
    public List<String> getTransactions() { return transactions; }
    public void setTransactions(List<String> txs) {
        this.transactions = txs;
        this.merkleRoot = HashUtil.buildMerkleRoot(txs);
        this.hash = calculateHash();
    }
    public boolean isTampered() { return tampered; }
    public void setTampered(boolean tampered) { this.tampered = tampered; }

    public String toJson() {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"index\":").append(index).append(",");
        sb.append("\"timestamp\":").append(timestamp).append(",");
        sb.append("\"data\":\"").append(escJson(data)).append("\",");
        sb.append("\"previousHash\":\"").append(previousHash).append("\",");
        sb.append("\"nonce\":").append(nonce).append(",");
        sb.append("\"hash\":\"").append(hash).append("\",");
        sb.append("\"merkleRoot\":\"").append(merkleRoot).append("\",");
        sb.append("\"tampered\":").append(tampered).append(",");
        sb.append("\"transactions\":[");
        for (int i = 0; i < transactions.size(); i++) {
            sb.append("\"").append(escJson(transactions.get(i))).append("\"");
            if (i < transactions.size() - 1) sb.append(",");
        }
        sb.append("]}");
        return sb.toString();
    }

    private String escJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
