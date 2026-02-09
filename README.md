src/blockchainvtk/Main.java

Là chương trình demo chính, điều khiển luồng chạy: chọn chế độ hash, tạo blockchain mẫu (genesis + vài block), hiển thị chuỗi, giả mạo dữ liệu và kiểm tra tính toàn vẹn, đồng thời demo “avalanche effect”. Dùng để chạy demo trực tiếp khi trình bày.
src/blockchainvtk/Block.java

Lớp biểu diễn một block thực tế (index, timestamp, data, previousHash, hash) và có phương thức calculateHash() để tính hash của block theo chiến lược hash được chọn. Đây là đối tượng dữ liệu chính để trực quan hóa cấu trúc block.
src/blockchainvtk/AbstractBlock.java

Lớp trừu tượng định nghĩa các trường chung và getter/setter cho block; bắt buộc các lớp con phải triển khai calculateHash(). Giúp tách phần chung và dễ mở rộng.
src/blockchainvtk/Blockchain.java

Quản lý danh sách block (chain): tạo genesis block, thêm block mới, in chuỗi, và kiểm tra tính toàn vẹn (isValid). Module này là “mô hình” chuỗi dùng cho các demo về bảo mật và tamper-detection.
src/blockchainvtk/HashStrategy.java

Interface cho chiến lược hash, cho phép chuyển đổi dễ dàng giữa các thuật toán hash (ví dụ SimpleHash và SHA-256). Dùng để so sánh hành vi của hàm băm khác nhau trong demo.
src/blockchainvtk/SimpleHash.java

Triển khai một hàm băm rất đơn giản (16 ký tự hex) — nhanh nhưng không an toàn, chỉ dùng cho mục đích giáo dục/so sánh. Dùng để minh họa ý nghĩa của hash và avalanche effect trong môi trường không phức tạp.
src/blockchainvtk/SHA256Hash.java

Triển khai SHA-256 (dùng MessageDigest). Dùng để so sánh với SimpleHash và cho thấy hành vi/độ an toàn của hàm băm công nghiệp.
src/blockchainvtk/HashComparison.java

Công cụ tập trung so sánh hai chiến lược hash: in ra hash, độ dài, tốc độ/bảo mật, và demo avalanche effect cho từng chiến lược. Hữu ích khi trình bày khác biệt giữa hash “giả lập” và hash thực tế.
