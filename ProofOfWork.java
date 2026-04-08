package com.blockedu.core;

import com.blockedu.model.Block;
import java.util.function.Consumer;

public class ProofOfWork {

    public static final int MAX_ATTEMPTS = 2_000_000;

    public interface MiningCallback {
        /** Called every N attempts. Return false to abort. */
        boolean onProgress(int nonce, String currentHash, long elapsedMs);
    }

    public static MiningResult mine(Block block, int difficulty, MiningCallback callback) {
        String target = "0".repeat(difficulty);
        long start = System.currentTimeMillis();
        int nonce = 0;
        String hash = "";

        while (nonce < MAX_ATTEMPTS) {
            block.setNonce(nonce);
            hash = block.calculateHash();
            if (hash.startsWith(target)) {
                block.setHash(hash);
                long elapsed = System.currentTimeMillis() - start;
                return new MiningResult(true, nonce, hash, elapsed, difficulty);
            }
            if (callback != null && nonce % 200 == 0) {
                boolean cont = callback.onProgress(nonce, hash, System.currentTimeMillis() - start);
                if (!cont) break;
            }
            nonce++;
        }
        // Didn't find — set whatever we have
        block.setHash(hash);
        long elapsed = System.currentTimeMillis() - start;
        return new MiningResult(false, nonce, hash, elapsed, difficulty);
    }

    public static class MiningResult {
        public final boolean success;
        public final int nonce;
        public final String hash;
        public final long elapsedMs;
        public final int difficulty;

        public MiningResult(boolean success, int nonce, String hash, long elapsedMs, int difficulty) {
            this.success = success;
            this.nonce = nonce;
            this.hash = hash;
            this.elapsedMs = elapsedMs;
            this.difficulty = difficulty;
        }

        public String toJson() {
            return String.format(
                "{\"success\":%b,\"nonce\":%d,\"hash\":\"%s\",\"elapsedMs\":%d,\"difficulty\":%d}",
                success, nonce, hash, elapsedMs, difficulty
            );
        }
    }
}
