package com.blockedu.core;

import com.blockedu.model.Block;
import com.blockedu.util.HashUtil;
import java.util.ArrayList;
import java.util.List;

public class Blockchain {
    private List<Block> chain;
    private int difficulty;

    public Blockchain(int difficulty) {
        this.difficulty = difficulty;
        this.chain = new ArrayList<>();
        Block genesis = createGenesis();
        chain.add(genesis);
    }

    private Block createGenesis() {
        Block b = new Block(0, "Genesis Block — BlockEdu Educational Chain", "0000000000000000000000000000000000000000000000000000000000000000");
        b.addTransaction("System: Chain initialized");
        return b;
    }

    public Block addBlock(String data, List<String> transactions) {
        Block prev = chain.get(chain.size() - 1);
        Block b = new Block(chain.size(), data, prev.getHash());
        if (transactions != null) {
            for (String tx : transactions) b.addTransaction(tx);
        }
        // Mine it
        ProofOfWork.mine(b, difficulty, null);
        chain.add(b);
        return b;
    }

    public boolean isChainValid() {
        for (int i = 1; i < chain.size(); i++) {
            Block cur  = chain.get(i);
            Block prev = chain.get(i - 1);
            String recalc = cur.calculateHash();
            if (!cur.getHash().equals(recalc)) return false;
            if (!cur.getPreviousHash().equals(prev.getHash())) return false;
        }
        return true;
    }

    public List<Boolean> getBlockValidities() {
        List<Boolean> validities = new ArrayList<>();
        validities.add(true); // genesis always valid structurally
        for (int i = 1; i < chain.size(); i++) {
            Block cur = chain.get(i);
            Block prev = chain.get(i - 1);
            String recalc = cur.calculateHash();
            boolean hashOk = cur.getHash().equals(recalc);
            boolean prevOk = cur.getPreviousHash().equals(prev.getHash());
            validities.add(hashOk && prevOk);
        }
        return validities;
    }

    public boolean tamperBlock(int index, String newData) {
        if (index <= 0 || index >= chain.size()) return false;
        Block b = chain.get(index);
        b.setData(newData);
        b.setTampered(true);
        // DO NOT recalculate hash — this is what makes it invalid
        return true;
    }

    public void restoreBlock(int index) {
        if (index <= 0 || index >= chain.size()) return;
        Block b = chain.get(index);
        // Remining restores validity
        Block prev = chain.get(index - 1);
        b.setPreviousHash(prev.getHash());
        b.setNonce(0);
        ProofOfWork.mine(b, difficulty, null);
        b.setTampered(false);
        // Propagate: fix all subsequent blocks
        for (int i = index + 1; i < chain.size(); i++) {
            Block cur = chain.get(i);
            Block prv = chain.get(i - 1);
            cur.setPreviousHash(prv.getHash());
            cur.setNonce(0);
            ProofOfWork.mine(cur, difficulty, null);
            cur.setTampered(false);
        }
    }

    public void setDifficulty(int d) { this.difficulty = d; }
    public int getDifficulty() { return difficulty; }
    public List<Block> getChain() { return chain; }
    public Block getBlock(int index) {
        if (index < 0 || index >= chain.size()) return null;
        return chain.get(index);
    }
    public int size() { return chain.size(); }

    public String toJson() {
        List<Boolean> validities = getBlockValidities();
        StringBuilder sb = new StringBuilder();
        sb.append("{\"difficulty\":").append(difficulty);
        sb.append(",\"valid\":").append(isChainValid());
        sb.append(",\"length\":").append(chain.size());
        sb.append(",\"chain\":[");
        for (int i = 0; i < chain.size(); i++) {
            Block b = chain.get(i);
            // inject validity into json
            String bJson = b.toJson();
            // insert "blockValid" field
            bJson = bJson.substring(0, bJson.length() - 1) + ",\"blockValid\":" + validities.get(i) + "}";
            sb.append(bJson);
            if (i < chain.size() - 1) sb.append(",");
        }
        sb.append("]}");
        return sb.toString();
    }
}
