# SƯỜN BÁO CÁO NGHIÊN CỨU KHOA HỌC

# Mô phỏng rút gọn hệ thống Bitcoin nhằm trực quan hóa giáo dục blockchain: thay thế chữ ký ECDSA bằng RSA-2048 và tích hợp RAG-AI có phân quyền trong nền tảng HubBlock

## 0. Thông tin chung

**Tên sản phẩm:** HubBlock - Interactive Blockchain Education Platform  
**Lĩnh vực:** Công nghệ thông tin, An toàn thông tin, Giáo dục công nghệ  
**Định hướng:** Nghiên cứu khoa học sinh viên, phát triển hệ thống, trực quan hóa giáo dục  
**Đối tượng sử dụng:** Sinh viên, giảng viên, quản trị viên hệ thống học tập  
**Ghi chú thuật ngữ:** Bitcoin thật dùng chữ ký số ECDSA/secp256k1. HubBlock dùng RSA-2048 trong môi trường mô phỏng riêng để trực quan hóa public key/private key, ký và xác minh. Không trình bày RSA-2048 như giải pháp thay thế Bitcoin thật.

---

## 1. Tóm tắt

### 1.1. Tóm tắt tiếng Việt

- Bối cảnh: Bitcoin/blockchain khó tiếp cận vì kết hợp mật mã học, hệ thống phân tán, đồng thuận và cấu trúc dữ liệu.
- Vấn đề: mô phỏng toàn bộ Bitcoin quá nặng cho mục tiêu học tập nhập môn.
- Giải pháp: xây dựng HubBlock, nền tảng web mô phỏng rút gọn các cơ chế cốt lõi của Bitcoin.
- Thành phần chính: SHA-256, block/chain, Proof-of-Work, Merkle Tree, RSA-2048, quiz/certificate, RAG chatbot, phân quyền admin/instructor/student.
- Đóng góp: mô hình mô phỏng giáo dục, chuẩn hóa thay thế ECDSA bằng RSA-2048 trong mạng riêng, tích hợp RAG-AI có kiểm soát nguồn và phân quyền.

### 1.2. Abstract tiếng Anh

- Giới thiệu HubBlock như một educational Bitcoin-inspired simulation.
- Nhấn mạnh artifact, methodology, evaluation plan và giới hạn của RSA-2048 trong mô phỏng.

### 1.3. Từ khóa

Bitcoin, blockchain, trực quan hóa giáo dục, Proof-of-Work, Merkle Tree, RSA-2048, ECDSA, RAG, AI chatbot, phân quyền.

---

## 2. Chương 1 - Mở đầu

### 2.1. Bối cảnh nghiên cứu

- Bitcoin là hệ thống tiền điện tử ngang hàng dựa trên cryptographic proof thay vì trusted third party.
- Người học gặp khó khi phải hiểu đồng thời hash, chữ ký số, block, mining, Merkle Tree, mạng ngang hàng và đồng thuận.
- Cần một công cụ trung gian giúp người học quan sát trực tiếp các cơ chế cốt lõi.
- AI đang được đưa vào học tập và phát triển phần mềm, tạo nhu cầu về RAG và phân quyền.

### 2.2. Lý do chọn đề tài

- Blockchain là nội dung nền tảng trong fintech, an toàn thông tin và hệ thống phân tán.
- Triển khai toàn bộ Bitcoin quá phức tạp cho nghiên cứu khoa học sinh viên.
- Trực quan hóa giúp giảm tải nhận thức và tăng khả năng hiểu cơ chế.
- Đề tài có tính cập nhật nhờ kết hợp Bitcoin 2008, RAG, vibe coding và AI authorization.

### 2.3. Vấn đề nghiên cứu

Làm thế nào để thiết kế và triển khai một hệ thống mô phỏng rút gọn Bitcoin đủ trực quan cho người học mới, vẫn giữ được tinh thần cốt lõi của blockchain, đồng thời tích hợp AI hỗ trợ học tập theo hướng có căn cứ và có phân quyền?

### 2.4. Mục tiêu nghiên cứu

- Phân tích các thành phần cốt lõi của Bitcoin.
- Thiết kế mô hình mô phỏng rút gọn phục vụ giáo dục.
- Triển khai HubBlock với các module blockchain, RSA-2048, RAG và phân quyền.
- Đề xuất bộ tiêu chí đánh giá chức năng, hiệu năng, học tập và an toàn.
- Làm rõ giới hạn giữa mô phỏng giáo dục và Bitcoin thật.

### 2.5. Câu hỏi nghiên cứu

**RQ1.** Những thành phần nào của Bitcoin cần được giữ lại trong một hệ thống mô phỏng giáo dục?  
**RQ2.** Việc thay chữ ký ECDSA bằng RSA-2048 trong mạng mô phỏng riêng ảnh hưởng thế nào đến tính dễ hiểu và tính trung thực khái niệm?  
**RQ3.** RAG giúp chatbot giảm nguy cơ hallucination như thế nào?  
**RQ4.** Phân quyền admin/instructor/student cần được thiết kế ra sao để giới hạn dữ liệu và ngữ cảnh AI?  
**RQ5.** Có thể đánh giá HubBlock bằng những chỉ số nào?

### 2.6. Giả thuyết nghiên cứu

- **H1:** Mô phỏng rút gọn gồm hash, block, Proof-of-Work, Merkle Tree và chữ ký số là đủ cho học tập nhập môn.
- **H2:** RSA-2048 dễ trực quan hóa hơn ECDSA cho người học mới, nhưng chỉ nên dùng trong mạng mô phỏng riêng.
- **H3:** RAG giúp chatbot trả lời có nguồn rõ hơn so với chatbot sinh tự do.
- **H4:** Phân quyền theo vai trò giúp giảm rủi ro lộ dữ liệu và sai ngữ cảnh AI.

### 2.7. Đối tượng và phạm vi nghiên cứu

- Đối tượng: hệ thống HubBlock và người học blockchain.
- Phạm vi triển khai: SHA-256, block/chain, mining, Merkle Tree, RSA-2048, quiz, certificate, RAG chatbot, RBAC.
- Ngoài phạm vi: Bitcoin node thật, P2P đầy đủ, UTXO đầy đủ, mempool, fee market, fork nhiều node, incentive kinh tế thật.

### 2.8. Đóng góp dự kiến

- Đóng góp thiết kế giáo dục: mô hình chắt lọc Bitcoin phục vụ trực quan hóa.
- Đóng góp kỹ thuật: hệ thống web tích hợp nhiều module học tập.
- Đóng góp AI giáo dục: chatbot RAG có nguồn và có phân quyền.

---

## 3. Chương 2 - Cơ sở lý thuyết và tổng quan nghiên cứu

### 3.1. Bitcoin như hệ thống tiền điện tử ngang hàng

- Trình bày Bitcoin whitepaper của Nakamoto (2008).
- Giải thích double-spending, trusted third party, peer-to-peer network.
- Nêu các cơ chế chính: transaction, timestamp server, Proof-of-Work, longest chain, incentive.

### 3.2. Chữ ký số và quyền sở hữu trong Bitcoin

- Bitcoin định nghĩa coin như một chuỗi chữ ký số.
- Bitcoin thật dùng ECDSA/secp256k1.
- ECDSA là chữ ký số, không phải cơ chế mã hóa dữ liệu giao dịch.
- HubBlock dùng RSA-2048 để minh họa khóa công khai/khóa riêng và thao tác ký/xác minh.

### 3.3. Proof-of-Work, nonce và difficulty

- Giải thích cơ chế tìm nonce sao cho hash thỏa điều kiện.
- Nêu tính bất đối xứng: khó tìm, dễ xác minh.
- Phân biệt difficulty mô phỏng trong HubBlock với difficulty thật của Bitcoin.

### 3.4. Merkle Tree và xác minh dữ liệu

- Giải thích Merkle root, Merkle branch, SPV.
- Trình bày vai trò của Merkle Tree trong Bitcoin.
- Nêu giá trị trực quan hóa trong HubBlock.

### 3.5. RSA, ECC và tác động của máy tính lượng tử

- So sánh nền tảng toán học của RSA và ECC/ECDSA.
- Dẫn NIST SP 800-57: RSA-2048 khoảng 112-bit security strength; ECC 256-bit khoảng 128-bit.
- Dẫn Shor algorithm: máy tính lượng tử đủ lớn ảnh hưởng đến cả RSA và ECDSA.
- Kết luận: dùng RSA-2048 vì mục tiêu giáo dục, không vì thay thế Bitcoin thật.

### 3.6. RAG và vấn đề hallucination

- Trình bày Retrieval-Augmented Generation theo Lewis et al. (2020).
- Giải thích parametric memory và non-parametric memory.
- Vai trò của RAG trong HubBlock: trả lời dựa trên tài liệu, có nguồn, giảm bịa nội dung.

### 3.7. Vibe coding và phát triển phần mềm có AI hỗ trợ

- Dựa trên Sarkar & Drosos (2025).
- Vibe coding là lập trình qua hội thoại với AI.
- Vai trò con người chuyển sang quản lý ngữ cảnh, kiểm thử, đọc code, đánh giá kết quả.
- Cần khai báo minh bạch việc dùng AI trong phát triển và viết báo cáo.

### 3.8. AI phân quyền và authorization

- Dựa trên Ibrahim & Li (2026).
- Agentic AI cần scope, delegation, accountability.
- HubBlock áp dụng ở mức RBAC và kiểm soát ngữ cảnh chatbot.

### 3.9. Khoảng trống nghiên cứu

- Nhiều demo blockchain chỉ trực quan hóa một phần nhỏ.
- Nhiều chatbot giáo dục chưa có RAG hoặc phân quyền.
- Cần một artifact kết hợp blockchain simulation, RAG-AI và RBAC.

---

## 4. Chương 3 - Phương pháp nghiên cứu

### 4.1. Cách tiếp cận Design Science Research

- Lý do chọn DSR: nghiên cứu tạo artifact công nghệ để giải quyết vấn đề thực tiễn.
- Artifact: nền tảng HubBlock.
- Vấn đề: khó học Bitcoin/blockchain bằng tài liệu tĩnh.
- Đánh giá: chức năng, hiệu năng, học tập, RAG và phân quyền.

### 4.2. Quy trình nghiên cứu

1. Nhận diện vấn đề.
2. Xác định mục tiêu giải pháp.
3. Thiết kế và phát triển HubBlock.
4. Trình diễn qua kịch bản học tập.
5. Đánh giá hệ thống.
6. Viết báo cáo và công bố kết quả.

### 4.3. Đối tượng tham gia thực nghiệm

- Sinh viên học blockchain, fintech, an toàn thông tin hoặc hệ thống phân tán.
- Giảng viên/chuyên gia đánh giá tính đúng khái niệm.
- Cỡ mẫu đề xuất: 20-30 sinh viên cho thử nghiệm ban đầu.

### 4.4. Công cụ và dữ liệu

- HubBlock, trình duyệt, Node.js, MongoDB.
- Bộ câu hỏi pre-test/post-test.
- Log mining, log RSA, log RAG retrieval.
- Phiếu khảo sát usability.

### 4.5. Chỉ số đánh giá

- Chức năng: hash đúng, chain valid/invalid, Merkle root đúng, RSA sign/verify đúng.
- Hiệu năng: thời gian mining, RSA keygen/sign/verify, RAG latency.
- Học tập: điểm pre-test/post-test, task completion, khảo sát.
- AI/RBAC: câu trả lời có nguồn, từ chối ngoài phạm vi, không lộ dữ liệu sai quyền.

### 4.6. Đạo đức nghiên cứu

- Ẩn danh dữ liệu sinh viên.
- Không công bố chat log chứa thông tin định danh.
- Khai báo việc sử dụng AI.
- Không bịa số liệu thực nghiệm.

---

## 5. Chương 4 - Phân tích yêu cầu và thiết kế hệ thống

### 5.1. Tổng quan HubBlock

- Nền tảng web tương tác phục vụ học blockchain.
- Frontend: React/Vite.
- Backend: Node.js/Express.
- Database: MongoDB.
- RSA: Web Crypto API.
- RAG: ingest tài liệu, chunking, embedding, retrieval, AI provider.

### 5.2. Tác nhân người dùng

| Vai trò | Mục tiêu | Quyền chính |
|---|---|---|
| Student | Học và thực hành | Dùng module học, làm quiz, hỏi chatbot |
| Instructor | Quản lý nội dung/lớp học | Theo dõi, quản lý quiz/tài liệu theo quyền |
| Admin | Quản trị hệ thống | Quản lý user, role, cấu hình, dữ liệu |

### 5.3. Yêu cầu chức năng

#### 5.3.1. Module Hash

- Nhập dữ liệu.
- Tính SHA-256.
- Quan sát avalanche effect.

#### 5.3.2. Module Mining và Blockchain Explorer

- Tạo block.
- Chọn difficulty.
- Mine block.
- Quan sát nonce, hash, previous hash.
- Kiểm tra chain valid/invalid.

#### 5.3.3. Module Merkle Tree

- Nhập danh sách giao dịch.
- Tính hash lá.
- Ghép cặp node.
- Tạo Merkle root.
- Quan sát root thay đổi khi transaction thay đổi.

#### 5.3.4. Module RSA

- RSA toán học nhỏ để minh họa công thức.
- RSA-2048 bằng Web Crypto API để demo kỹ thuật thực tế hơn.
- Ký/xác minh thông điệp.
- Phân biệt mã hóa và chữ ký số.

#### 5.3.5. Quiz và Certificate

- Câu hỏi theo chủ đề.
- Chấm điểm.
- Cấp certificate khi đạt ngưỡng.

#### 5.3.6. AI Chatbot RAG

- Nhận câu hỏi người học.
- Truy xuất tài liệu liên quan.
- Tạo câu trả lời có nguồn.
- Từ chối khi ngoài phạm vi.

#### 5.3.7. Phân quyền

- Đăng ký/đăng nhập.
- JWT authentication.
- RBAC theo admin/instructor/student.
- Kiểm soát route và ngữ cảnh AI.

### 5.4. Yêu cầu phi chức năng

- Dễ dùng.
- Phản hồi nhanh.
- Đúng khái niệm.
- Có nguồn trích dẫn.
- Bảo mật role/token.
- Dễ mở rộng.
- Có thể tái lập benchmark.

### 5.5. Kiến trúc tổng thể

`User -> React UI -> Express API -> Auth/RBAC -> Module Services -> Database/RAG Index/AI Provider`

### 5.6. Thiết kế dữ liệu

- User.
- Quiz.
- QuizAttempt.
- Certificate.
- Block.
- RAGChunk.
- ChatLog.

### 5.7. Thiết kế bảo mật

- Backend kiểm tra token và role.
- Không tin dữ liệu role từ client.
- Route nhạy cảm cần middleware.
- Prompt AI phải được lọc theo role.
- Không đưa dữ liệu nhạy cảm vào RAG hoặc prompt.

---

## 6. Chương 5 - Triển khai hệ thống HubBlock

### 6.1. Công nghệ sử dụng

- React, Vite.
- Node.js, Express.
- MongoDB.
- Web Crypto API.
- OpenAI/Gemini API tùy cấu hình.
- RAG index từ tài liệu PDF.

### 6.2. Triển khai SHA-256

- Input -> hash.
- So sánh hash khi input thay đổi.
- Liên hệ với block hash và Merkle hash.

### 6.3. Triển khai Blockchain core

- Lớp Block.
- Lớp Blockchain.
- Genesis block.
- Add block.
- Validate chain.

### 6.4. Triển khai Mining

- Vòng lặp nonce.
- Điều kiện difficulty.
- Hash thỏa prefix/điều kiện.
- Đo thời gian và số nonce.

### 6.5. Triển khai Merkle Tree

- Hash từng transaction.
- Ghép cặp node.
- Xử lý số lá lẻ.
- Tính root.

### 6.6. Triển khai RSA

- RSA số nhỏ: prime, gcd, extended Euclid, modular exponentiation.
- RSA-2048: generate key pair, sign, verify, encrypt/decrypt nếu có.
- Giải thích giới hạn bảo mật của RSA số nhỏ.

### 6.7. Triển khai Quiz và Certificate

- Tạo câu hỏi.
- Chấm điểm.
- Lưu attempt.
- Sinh certificate.

### 6.8. Triển khai RAG chatbot

- Ingest PDF.
- Extract text.
- Chunking.
- Embedding.
- Similarity search.
- Build context.
- Gọi AI provider.
- Trả answer + sources.

### 6.9. Triển khai Auth/RBAC

- User model có role.
- JWT middleware.
- Route admin.
- Route instructor.
- Kiểm thử route với từng role.

### 6.10. Các thách thức production phù hợp với HubBlock

Từ nhóm thách thức của môi trường production, báo cáo lựa chọn các nội dung có liên hệ trực tiếp nhất với HubBlock thay vì mở rộng sang toàn bộ bài toán vận hành hạ tầng. Các nội dung phù hợp gồm xử lý lỗi của module AI/RAG, kiểm thử hành vi chatbot, kiểm soát đầu vào và rò rỉ dữ liệu theo phân quyền, cùng tối ưu thời gian phản hồi khi hệ thống phụ thuộc vào AI provider, embedding service và database. Các vấn đề hạ tầng quy mô lớn như triển khai đa vùng, autoscaling hoặc cân bằng tải phức tạp chưa phải trọng tâm của báo cáo này.

#### 6.10.1. Error handling cho RAG chatbot

- Hiển thị thông báo lỗi thân thiện khi chatbot không thể tạo câu trả lời, không tìm thấy tài liệu phù hợp hoặc AI provider không phản hồi.
- Không để người dùng nhìn thấy stack trace, token, prompt hệ thống, cấu hình API hoặc thông tin nội bộ của backend.
- Có phương án fallback khi dịch vụ AI/RAG tạm thời không sẵn sàng, chẳng hạn yêu cầu người dùng thử lại, trả về thông báo giới hạn chức năng hoặc dùng kết quả truy xuất tài liệu cơ bản nếu phù hợp.

#### 6.10.2. Testing and validation hành vi chatbot

- Kiểm thử câu hỏi ngoài phạm vi tài liệu để đánh giá khả năng từ chối đúng thay vì tạo nội dung không có căn cứ.
- Kiểm thử câu hỏi mơ hồ, câu hỏi sai giả định và câu hỏi lặp lại để xác định mức độ nhất quán của phản hồi.
- Kiểm thử trường hợp retrieval trả về tài liệu không liên quan nhằm đánh giá khả năng chatbot giới hạn câu trả lời theo nguồn được phép sử dụng.

#### 6.10.3. Moderation and safety theo phân quyền

- Kiểm soát các đầu vào không mong muốn như prompt injection, yêu cầu tiết lộ system prompt, yêu cầu bỏ qua phân quyền hoặc yêu cầu truy xuất dữ liệu của vai trò khác.
- Giảm nguy cơ rò rỉ dữ liệu bằng cách lọc ngữ cảnh RAG theo role, không đưa dữ liệu quản trị vào prompt của student và không lưu thông tin nhạy cảm trong vector index nếu không cần thiết.
- Thiết lập nguyên tắc trả lời an toàn: chỉ trả lời dựa trên tài liệu được phép truy cập, nêu rõ khi không có đủ căn cứ và từ chối yêu cầu vượt phạm vi học tập.

#### 6.10.4. Response time khi gọi dịch vụ bên ngoài

- Tập trung đánh giá các phụ thuộc trực tiếp của HubBlock gồm AI provider, embedding service, database và API nội bộ phục vụ chatbot.
- Cấu hình timeout, retry có giới hạn và cơ chế xử lý khi API trả lỗi để tránh làm treo giao diện người dùng.
- Theo dõi các chỉ số vận hành như average latency, P95 latency, timeout rate, fallback rate và tỷ lệ phản hồi bị từ chối vì lý do an toàn.

---

## 7. Chương 6 - Đánh giá và kế hoạch thực nghiệm

### 7.1. Nguyên tắc đánh giá

- Không bịa số liệu.
- Phân biệt kết quả đã đo và kết quả dự kiến đo.
- Đánh giá cả kỹ thuật và hiệu quả học tập.

### 7.2. Kiểm thử chức năng

| Mã | Chức năng | Kết quả kỳ vọng |
|---|---|---|
| F01 | SHA-256 cùng input | Hash giống nhau |
| F02 | SHA-256 đổi 1 ký tự | Hash thay đổi mạnh |
| F03 | Add block | previousHash đúng |
| F04 | Sửa block cũ | Chain invalid |
| F05 | Mining | Hash thỏa difficulty |
| F06 | Merkle root | Root ổn định |
| F07 | RSA sign/verify | Verify true |
| F08 | RAG chatbot | Trả lời có nguồn |
| F09 | Student gọi admin route | Bị từ chối |
| F10 | Admin gọi admin route | Được phép |
| F11 | Câu hỏi RAG ngoài phạm vi | Từ chối có giải thích, không bịa nội dung |
| F12 | AI/RAG service không sẵn sàng | Thông báo lỗi thân thiện hoặc kích hoạt fallback |
| F13 | Prompt yêu cầu vượt quyền | Không đưa dữ liệu sai role vào context |
| F14 | External API timeout | Không treo UI, ghi nhận lỗi và trả phản hồi phù hợp |

### 7.3. Benchmark mining

- Difficulty 1-5.
- Mỗi mức chạy 30 lần.
- Đo time, nonce, hash.
- Tính trung bình, trung vị, độ lệch chuẩn.

### 7.4. Benchmark RSA

- RSA-2048 key generation.
- Sign.
- Verify.
- Encrypt/decrypt nếu có.
- Không kết luận nhanh hơn ECDSA nếu chưa benchmark ECDSA cùng điều kiện.

### 7.5. Benchmark RAG

- 50 câu hỏi mẫu.
- Nhóm câu trong tài liệu, ngoài phạm vi, nhạy cảm quyền.
- Đo latency, top-k retrieval, citation accuracy.

### 7.6. Đánh giá học tập

- Pre-test/post-test 20 câu.
- Task-based evaluation.
- Khảo sát usability 1-5.
- Phân tích điểm trước/sau.

### 7.7. Đánh giá phân quyền

- Kiểm thử API trực tiếp.
- Kiểm thử UI.
- Kiểm thử chatbot context theo role.
- Kiểm tra không lộ admin context cho student.

### 7.8. Đánh giá các thách thức production được chọn

- Kiểm thử error handling bằng cách mô phỏng lỗi AI provider, lỗi database, lỗi timeout, lỗi tài liệu không đọc được và lỗi token hết hạn.
- Kiểm thử chatbot validation bằng bộ câu hỏi gồm câu hỏi đúng phạm vi, ngoài phạm vi, mơ hồ, sai giả định, lặp lại nhiều lần và câu hỏi có nội dung gây nhiễu.
- Kiểm thử moderation and safety bằng các prompt yêu cầu tiết lộ system prompt, truy cập dữ liệu admin, bỏ qua phân quyền hoặc trả lời ngoài tài liệu nguồn.
- Kiểm thử response time bằng cách đo thời gian truy xuất tài liệu, thời gian gọi embedding service, thời gian gọi AI provider và tổng thời gian trả lời của chat endpoint.
- Ghi nhận các chỉ số: error rate, fallback success rate, refusal accuracy, data leakage incident count, average latency và P95 latency. Các giá trị cụ thể chỉ được báo cáo sau khi có dữ liệu thực nghiệm.

---

## 8. Chương 7 - Thảo luận

### 8.1. Mức độ giữ lại tinh thần Bitcoin

- Giữ lại hash, block chain, Proof-of-Work, Merkle Tree, chữ ký số.
- Lược bỏ P2P thật, UTXO đầy đủ, mempool, fee, fork nhiều node.
- Kết luận: phù hợp cho giáo dục nhập môn nếu công bố rõ giới hạn.

### 8.2. Thảo luận về RSA-2048 thay ECDSA

- RSA-2048 dễ giải thích hơn cho người học mới.
- ECDSA/secp256k1 là cơ chế thật của Bitcoin.
- RSA-2048 không nên được trình bày là mạnh hơn hoặc phù hợp hơn cho Bitcoin.
- Cần benchmark nếu muốn nói về tốc độ.

### 8.3. Máy tính lượng tử

- Shor algorithm ảnh hưởng đến RSA và ECC/ECDSA.
- Máy tính cổ điển hiện tại không thực tế để suy private key từ public key với tham số đúng.
- Máy tính lượng tử đủ lớn có thể phá nền tảng toán học của public-key cryptography hiện nay.

### 8.4. RAG và hallucination

- RAG giảm rủi ro nhưng không loại bỏ hoàn toàn hallucination.
- Cần source citation, prompt giới hạn và kiểm thử câu hỏi chuẩn.

### 8.5. Phân quyền AI

- AI context phải theo role.
- Student không được nhận dữ liệu admin.
- Cần audit log và policy rõ ràng nếu mở rộng agentic AI.

### 8.6. Thách thức production được chọn cho phạm vi nghiên cứu

- Các thách thức production được chọn trong báo cáo tập trung vào RAG chatbot và RBAC vì đây là hai thành phần làm HubBlock khác với một mô phỏng blockchain thông thường.
- Chất lượng phản hồi của chatbot phụ thuộc vào retrieval, prompt, mô hình sinh và quyền truy cập của người dùng. Vì vậy, kiểm thử một câu trả lời đúng là chưa đủ; cần đánh giá thêm hành vi từ chối, tính nhất quán, khả năng chống prompt injection và nguy cơ rò rỉ dữ liệu.
- Các yếu tố error handling, fallback, timeout và response time có ảnh hưởng trực tiếp đến trải nghiệm học tập, đặc biệt khi người học đặt câu hỏi liên tục trong quá trình thực hành.
- Trong phạm vi nghiên cứu hiện tại, các tiêu chí production được xem là lớp đánh giá mở rộng. Kết luận định lượng về độ ổn định, fallback success rate hoặc P95 latency chỉ nên trình bày sau khi đã chạy benchmark và kiểm thử thực nghiệm.

### 8.7. Hạn chế

- Chưa có P2P thật.
- Chưa có UTXO đầy đủ.
- Chưa có benchmark thực nghiệm trong bản sườn.
- RAG phụ thuộc chất lượng tài liệu.
- RBAC mới ở mức cơ bản.
- Chưa có số liệu production thực tế về error rate, fallback success rate, refusal accuracy và P95 latency.

### 8.8. Hướng phát triển

- Multi-node simulation.
- UTXO đơn giản.
- ECDSA/secp256k1 benchmark.
- Merkle proof interactive.
- Dashboard instructor.
- Policy-based AI authorization.
- Post-quantum demo.

---

## 9. Chương 8 - Kết luận và hướng phát triển

### 9.1. Kết luận

- HubBlock là mô phỏng rút gọn Bitcoin phục vụ giáo dục.
- Hệ thống giữ các thành phần cốt lõi đủ để trực quan hóa blockchain.
- RSA-2048 dùng cho mục tiêu sư phạm trong mạng riêng.
- RAG giúp chatbot có căn cứ hơn.
- RBAC giúp kiểm soát quyền và ngữ cảnh AI.

### 9.2. Đề xuất hoàn thiện trước khi nộp

- Chạy demo end-to-end.
- Chụp ảnh giao diện.
- Đo benchmark mining/RSA/RAG.
- Kiểm thử RBAC.
- Thu pre-test/post-test nếu có lớp học.
- Rà soát APA 7.
- Chuyển bản cuối sang Word/PDF.

---

## 10. Các tuyên bố học thuật

### 10.1. Data Availability Statement

- Mã nguồn, benchmark và dữ liệu khảo sát có thể công bố sau khi loại bỏ thông tin nhạy cảm.

### 10.2. Ethics Declaration

- Dữ liệu người học cần được ẩn danh.
- Chat log cần được bảo vệ.

### 10.3. Conflict of Interest Statement

- Không có xung đột lợi ích tài chính.

### 10.4. Funding Statement

- Bổ sung nếu có nguồn tài trợ.

### 10.5. Author Contributions

- Conceptualization.
- Methodology.
- Software.
- Validation.
- Investigation.
- Writing.
- Supervision.

### 10.6. AI Usage Disclosure

- Khai báo AI được dùng để hỗ trợ lập cấu trúc, tổng hợp tài liệu, viết nháp, debug hoặc sinh code nếu có.
- Nhóm tác giả chịu trách nhiệm cuối cùng về tính đúng và trung thực.

---

## 11. Tài liệu tham khảo chính cần có

- Nakamoto, S. (2008). *Bitcoin: A peer-to-peer electronic cash system*. https://bitcoin.org/bitcoin.pdf
- Bitcoin Developer Guide. (n.d.). *Transactions*. https://developer.bitcoin.org/devguide/transactions.html
- Barker, E. (2020). *Recommendation for key management: Part 1 - General* (NIST SP 800-57 Part 1 Revision 5). https://doi.org/10.6028/NIST.SP.800-57pt1r5
- National Institute of Standards and Technology. (2015). *Secure Hash Standard (SHS)*. https://doi.org/10.6028/NIST.FIPS.180-4
- Shor, P. W. (1995). *Polynomial-time algorithms for prime factorization and discrete logarithms on a quantum computer*. https://arxiv.org/abs/quant-ph/9508027
- Gidney, C., & Ekera, M. (2021). How to factor 2048 bit RSA integers in 8 hours using 20 million noisy qubits. https://doi.org/10.22331/q-2021-04-15-433
- Roetteler, M., Naehrig, M., Svore, K. M., & Lauter, K. (2017). *Quantum resource estimates for computing elliptic curve discrete logarithms*. https://doi.org/10.48550/arXiv.1706.06752
- Lewis, P., et al. (2020). *Retrieval-augmented generation for knowledge-intensive NLP tasks*. https://proceedings.neurips.cc/paper/2020/hash/6b493230205f780e1bc26945df7481e5-Abstract.html
- Sarkar, A., & Drosos, I. (2025). *Vibe coding: Programming through conversation with artificial intelligence*. https://arxiv.org/abs/2506.23253
- Ibrahim, A., & Li, Y. (2026). *Overlaying governance: A compositional authorization framework for delegation and scope in agentic AI*. https://arxiv.org/abs/2606.03518
- Rivest, R. L., Shamir, A., & Adleman, L. (1978). A method for obtaining digital signatures and public-key cryptosystems. https://doi.org/10.1145/359340.359342
- Hevner, A. R., March, S. T., Park, J., & Ram, S. (2004). Design science in information systems research. https://doi.org/10.2307/25148625

---

## 12. Phụ lục đề xuất

### Phụ lục A. Mapping giữa Bitcoin gốc và HubBlock

- SHA-256.
- Digital signatures.
- ECDSA/secp256k1.
- RSA-2048.
- Proof-of-Work.
- Merkle Tree.
- P2P network.
- UTXO.
- Incentive.

### Phụ lục B. Bộ câu hỏi pre-test/post-test

- 20 câu chia theo chủ đề hash, block, mining, Merkle, RSA/ECDSA, RAG và phân quyền.

### Phụ lục C. Mẫu khảo sát người học

- Thang đo 1-5 về usability và hiệu quả học tập.
- Câu hỏi mở về phần dễ hiểu, phần khó hiểu và đề xuất cải tiến.

### Phụ lục D. Kế hoạch benchmark tối thiểu

- Mining difficulty 1-5.
- RSA keygen/sign/verify.
- RAG retrieval.
- Chat endpoint.
- RBAC route.
- Error handling và fallback khi AI/RAG service không sẵn sàng.
- Moderation/safety đối với prompt injection, câu hỏi ngoài phạm vi và yêu cầu vượt quyền.
- Latency của external systems gồm AI provider, embedding service, database và API nội bộ.

### Phụ lục E. Checklist nộp báo cáo

- [ ] Dùng thống nhất thuật ngữ RSA-2048.
- [ ] Dùng thống nhất thuật ngữ chữ ký số ECDSA.
- [ ] Có số liệu benchmark thật hoặc ghi rõ chưa đo.
- [ ] Có kết quả pre-test/post-test nếu đã thực nghiệm.
- [ ] Ghi rõ HubBlock là mô phỏng giáo dục.
- [ ] Có tài liệu tham khảo theo APA 7.
- [ ] Có AI Usage Disclosure.
- [ ] Đã kiểm thử phân quyền.
- [ ] Đã kiểm thử chatbot không lộ dữ liệu sai quyền.
- [ ] Đã kiểm thử error handling và fallback cho module RAG/AI.
- [ ] Đã kiểm thử câu hỏi ngoài phạm vi, prompt injection và đầu vào không mong muốn.
- [ ] Đã ghi rõ nếu chưa có số liệu production về error rate, fallback success rate và P95 latency.
