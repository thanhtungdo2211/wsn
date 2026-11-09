# Tổng quan bài tập WSN – Paper Summary

> Tài liệu này giải thích ngắn gọn **bài tập yêu cầu gì**, **paper nói về điều gì**, và **các thành phần chính của paper/report**, bắt đầu từ những khái niệm cơ bản nhất của mạng cảm biến không dây (WSN).

---

## 1. Đề bài yêu cầu gì?

Môn học cho mỗi team (tối đa 2 sinh viên) chọn **một trong hai** hướng:

| Lựa chọn | Nội dung | Đầu ra |
|---|---|---|
| **A. Summary paper** *(đã chọn)* | Tóm tắt 1 trong 2 paper survey được giao | Report + slide thuyết trình |
| B. Simulation | Mô phỏng một mạng WSN để trả lời 2 câu hỏi: (1) khi node **dày đặc** thì **contention** và **PDR** thay đổi thế nào; (2) mô hình **many-to-one** (nhiều node nhỏ gửi về 1 hub, hub gửi về server ở xa) có **tiết kiệm năng lượng** hơn việc mọi node tự gửi về trung tâm không | Kết quả mô phỏng |

**Lựa chọn của mình:** làm summary một mình, chọn **Paper B**:

> M. Trigka, E. Dritsas, *“Wireless Sensor Networks: From Fundamentals and Applications to Innovations and Future Trends”*, **IEEE Access**, vol. 13, pp. 96365–96399, 2025. DOI: 10.1109/ACCESS.2025.3572328

Lý do chọn: Paper A (Ojha & Gupta, 2025) chủ yếu là phân tích thư mục (đếm số bài báo theo năm, theo nhà xuất bản). Paper B mang tính kỹ thuật, bám sát nội dung môn học (kiến trúc, năng lượng, MAC, routing).

Dù không làm simulation, report vẫn **trả lời được một phần hai câu hỏi trên** bằng một ví dụ tính toán năng lượng (xem mục 6).

**Sản phẩm trong repo:**

| File | Nội dung |
|---|---|
| `report/WSN_Summary_Report.docx` | Report tiếng Anh (ước tính 13–15 trang A4, trang bìa HUST) |
| `slides/WSN_Presentation.pptx` | 14 slide theo template HUST, khoảng 13 phút |
| `slides/speaker_notes.md` | Lời nói cho từng slide (tiếng Việt) và câu hỏi có thể gặp |

---

## 2. Khái niệm cơ bản: WSN là gì?

### 2.1 Sensor node và sink

Một **mạng cảm biến không dây (Wireless Sensor Network – WSN)** gồm rất nhiều thiết bị nhỏ gọi là **sensor node**, rải trong một khu vực để đo đạc môi trường (nhiệt độ, độ ẩm, rung động, khí gas…) rồi gửi dữ liệu không dây về một điểm thu gọi là **sink** (hay **base station**). Từ sink, dữ liệu được đưa lên server hoặc cloud.

Mỗi sensor node có 4 khối:

```
┌────────────────────────────────────────────┐
│ Sensing   → cảm biến đo đại lượng vật lý   │
│ Processing→ vi điều khiển xử lý, lọc dữ liệu│
│ Radio     → thu/phát không dây             │  ← tốn năng lượng nhất
│ Power     → pin (đôi khi có pin mặt trời…) │
└────────────────────────────────────────────┘
```

### 2.2 Vì sao năng lượng là vấn đề số 1?

- Node chạy **bằng pin**, thường đặt ở nơi khó tiếp cận (rừng, đường ống, dưới nước…), nên **không thay pin được**.
- **Bộ radio tiêu tốn năng lượng nhiều nhất.** Năng lượng tốn không chỉ khi gửi mà cả khi **nhận** và khi **nghe ngóng kênh mà không có gì để nhận (idle listening)**.
- Năng lượng phát tăng rất nhanh theo khoảng cách: tỉ lệ với **d²** ở cự ly ngắn và **d⁴** ở cự ly dài. Vì vậy gửi xa “đắt” hơn rất nhiều so với gửi gần.

Hệ quả: gần như mọi kỹ thuật trong WSN (kiến trúc, MAC, routing…) đều xoay quanh câu hỏi **làm sao kéo dài thời gian sống của mạng (network lifetime)**.

### 2.3 Một số thuật ngữ nền tảng

| Thuật ngữ | Giải thích ngắn |
|---|---|
| **Hop / multi-hop** | Một lần truyền từ node này sang node kia là 1 hop. Dữ liệu có thể đi qua nhiều node trung gian (multi-hop) để tới sink. |
| **Cluster / Cluster head (CH)** | Nhóm các node gần nhau thành một cụm; một node làm “trưởng cụm” (CH) gom dữ liệu của cả cụm rồi gửi về sink. Đây chính là “hub node” trong đề bài. |
| **Data aggregation** | CH gộp nhiều số đo thành một gói (ví dụ lấy trung bình) để giảm số gói phải gửi. |
| **Duty cycle (D)** | Tỉ lệ thời gian node thức: D = T_active / T_cycle. D = 1% nghĩa là node ngủ 99% thời gian. |
| **MAC (Medium Access Control)** | Luật “ai được nói lúc nào” trên kênh vô tuyến dùng chung. |
| **Contention / Collision** | Nhiều node cùng muốn gửi (tranh chấp kênh); nếu gửi trùng lúc thì các gói **va chạm** và hỏng, phải gửi lại. |
| **Routing** | Chọn đường đi (qua các node trung gian) để đưa dữ liệu tới sink. |
| **PDR (Packet Delivery Ratio)** | Tỉ lệ gói tới đích thành công trên tổng số gói gửi. |

---

## 3. Paper nói về điều gì? Mục đích trong WSN

Paper B là một **survey** (bài tổng quan), không đề xuất thuật toán mới. Mục đích:

1. **Tổng hợp nền tảng** của WSN: kiến trúc, mô hình năng lượng, giao thức MAC và routing, kỹ thuật ước lượng tham số.
2. **Liệt kê ứng dụng thực tế** ở 12 lĩnh vực, mỗi lĩnh vực kèm một dự án đã triển khai.
3. **Tổng hợp các đổi mới công nghệ** gần đây: energy harvesting, TinyML, federated learning, blockchain, software-defined WSN…
4. **Chỉ ra thách thức còn mở** và **định hướng nghiên cứu tương lai**.

Điểm tác giả nhấn mạnh so với các survey trước: không chỉ nói về một chủ đề như routing hay clustering, mà **nối kiến thức kinh điển với các chủ đề liên ngành mới** (quantum sensing, federated intelligence, blockchain trust, digital twin) và với môi trường khắc nghiệt (dưới nước, ngoài không gian).

**Quy mô paper:** 35 trang, 355 tài liệu tham khảo, 10 bảng so sánh.

**Cấu trúc 5 phần chính:**

```
 Section II        Section III     Section IV      Section V      Section VI
 Fundamentals  →  Applications  →  Innovations  →  Challenges  →  Future trends
 (nền tảng)       (ứng dụng)       (đổi mới)       (thách thức)   (xu hướng)
```

---

## 4. Các thành phần chính của paper (giải thích từ cơ bản)

### 4.1 Kiến trúc mạng (Architectures)

Paper phân loại theo 3 chiều.

**(a) Số tầng: phẳng (single-tier) và nhiều tầng / phân cụm (multi-tier, clustered)**

```
 Phẳng (flat):                         Phân cụm (clustered):
   o   o   o                             o o      o o
    \  |  /                               \|      |/
  o — o — o — SINK                      [CH]    [CH]   ← cluster head gom dữ liệu
       |                                    \    /
       o   ← node gần sink phải chuyển         SINK
             tiếp cho cả mạng → hết pin sớm
```

- **Phẳng:** đơn giản, rẻ. Nhược điểm là các node gần sink gánh dữ liệu của cả mạng nên chết trước (gọi là **energy hole** hoặc hot spot).
- **Phân cụm:** dễ mở rộng, phần lớn node chỉ cần gửi gần tới CH. Nhược điểm là CH phải gánh tải nặng, và cần thêm chi phí để chọn CH và đồng bộ.

**(b) Vị trí của quyền điều khiển**

- **Centralized:** sink quyết định mọi thứ. Sink có cái nhìn toàn cục nhưng là điểm lỗi duy nhất và dễ thành nút cổ chai.
- **Decentralized:** điều khiển chia theo các cụm (CH).
- **Distributed:** node tự quyết định dựa trên thông tin trao đổi với hàng xóm, đi tới thống nhất bằng **thuật toán đồng thuận (consensus)**: xᵢ ← xᵢ + ε·Σ(xⱼ − xᵢ), tức mỗi node tiến dần về giá trị trung bình của các hàng xóm. Kiểu này bền vững nhất nhưng tốn chi phí phối hợp.

**(c) Duty cycling:** node luân phiên ngủ và thức để tiết kiệm năng lượng. Đổi lại phải đồng bộ thời gian và chịu thêm độ trễ.

*Nhận xét của tác giả:* kiến trúc phân cụm và kiến trúc nhiều tầng thực chất có cùng cấu trúc, nên dùng chung được một mô hình năng lượng.

### 4.2 Gộp dữ liệu và độ tin cậy

- **Data aggregation:** gộp dữ liệu theo cụm (CH), theo cây (tree), hoặc thích ứng. Ưu điểm là bớt số gói phải gửi. Nhược điểm là tăng độ trễ, và node gộp dữ liệu trở thành mục tiêu tấn công.
- **Kiểm soát lỗi:** **FEC** (gửi kèm dữ liệu dư để bên nhận tự sửa lỗi, tốn tính toán) và **ARQ** (lỗi thì gửi lại, tốn năng lượng truyền).
- **Đồng bộ thời gian** (ví dụ RBS): bắt buộc phải có để các node ngủ và thức cùng nhịp.

### 4.3 Mô hình năng lượng: “sợi chỉ xuyên suốt” của paper

Paper gắn một công thức năng lượng cho mỗi kiến trúc và mỗi giao thức. Ý tưởng chung là **cộng năng lượng của từng hoạt động**:

| Mô hình | Công thức (dạng lời) |
|---|---|
| Baseline | Tổng năng lượng = Σ (cảm biến + xử lý + phát + nhận) của mọi node |
| Centralized (1 hop) | Σ (cảm biến + phát thẳng về sink) |
| Clustered | Σ năng lượng cục bộ của node thành viên + Σ năng lượng của các CH |
| Duty-cycled | Σ [ D·P_active + (1−D)·P_sleep ] |
| Routing | Σ qua H hop của (phát + nhận + phần thêm: sửa lỗi / mã hóa…) |

⚠️ **Hạn chế:** đây chỉ là các đẳng thức “kế toán”, cho biết **cần cộng những gì** nhưng **không có khoảng cách, kênh truyền hay va chạm** bên trong. Vì vậy chỉ từ các công thức này thì không trả lời được câu hỏi “khi nào phân cụm có lợi?”. Report bổ sung phần này ở mục 6.

### 4.4 Giao thức MAC: ai được nói lúc nào?

Hình dung kênh vô tuyến như **một phòng họp có nhiều người muốn nói**:

| Lớp | Ví von | Ví dụ | Ưu / nhược |
|---|---|---|---|
| **Contention-free** | Chia lịch, mỗi người một khung giờ | TDMA, FDMA, IEEE 802.15.4e TSCH | Không va chạm, nhưng cần đồng bộ chặt |
| **Contention-based** | Ai rảnh thì “nghe trước rồi nói” | CSMA/CA, S-MAC, T-MAC, B-MAC, X-MAC | Đơn giản; nhưng **mạng càng dày thì va chạm và idle listening càng nhiều** (RTS/CTS giúp giảm bớt) |
| **Hybrid** | Ít người thì tự do, đông thì chia lịch | Z-MAC | Thích ứng theo tải |
| **Adaptive** | Học dần cách nói hợp lý | MAC dùng reinforcement learning | Mới, đang nghiên cứu |

→ Đây là phần liên quan trực tiếp tới **câu hỏi 1 của đề** (mạng dày đặc, contention, PDR).

### 4.5 Giao thức routing: đi đường nào về sink?

| Họ | Ý tưởng | Ví dụ |
|---|---|---|
| Data-centric | Sink hỏi “ai có dữ liệu X?”, các node trả lời và gộp dữ liệu dọc đường | Directed Diffusion, SPIN |
| Hierarchical | Phân cụm, CH gom và gửi | **LEACH** (luân phiên CH), PEGASIS (xếp thành chuỗi), HEED (chọn CH theo năng lượng còn lại) |
| Location-based | Dùng tọa độ, chuyển tới hàng xóm gần đích nhất | GPSR, GEAR |
| Multipath | Chia dữ liệu theo nhiều đường để cân bằng tải và dự phòng | MPDD, ReInForM |
| QoS-aware | Đảm bảo độ trễ, độ tin cậy | SPEED, SAR |
| Security-oriented | Có mã hóa và chống xâm nhập | S-LEACH, INSENS |

→ Họ hierarchical liên quan trực tiếp tới **câu hỏi 2 của đề** (mô hình many-to-one với hub node).

### 4.6 Ước lượng tham số (Parameter estimation)

Dữ liệu từ cảm biến luôn có nhiễu, nên cần ước lượng giá trị thật:

- **MLE:** chọn giá trị làm cho dữ liệu đo được “hợp lý nhất”, ví dụ định vị nguồn tín hiệu từ khoảng cách đo được.
- **Bayesian:** kết hợp kiến thức có sẵn (prior) với số đo mới. Chính xác nhưng tính toán nặng.
- **Kalman filter:** dự đoán rồi hiệu chỉnh liên tục. Nhẹ, chạy được thời gian thực, hay dùng để bám mục tiêu.
- **LMS:** cập nhật dần trọng số theo sai số. Rất nhẹ, có biến thể phân tán (ATC, CTA) để các node cùng hợp tác.

### 4.7 Ứng dụng (12 lĩnh vực)

Mỗi ứng dụng là sự kết hợp **cảm biến + thuật toán xử lý/ML + cơ chế mạng**, và đều có dự án thực tế đi kèm:

| Lĩnh vực | Ví dụ kỹ thuật | Triển khai thực tế |
|---|---|---|
| Môi trường | RNN dự báo vi khí hậu, Kalman cảnh báo sạt lở | Internet of Forests (Amazon) |
| Y tế | Body sensor network, CNN/LSTM phát hiện bất thường | Giám sát sinh hiệu trong bệnh viện |
| Công nghiệp | Phân tích rung động FFT, WirelessHART | Đường ống dầu khí ở Nigeria |
| Thành phố thông minh | Dự đoán giao thông, đèn đường thích ứng | Cary, North Carolina (cảnh báo lũ) |
| Nông nghiệp | Độ ẩm đất, CNN nhận dạng sâu bệnh | Cảm biến dinh dưỡng ruộng cà chua |
| Quốc phòng | Giám sát âm thanh/địa chấn, mã hóa ECC | Dự án iMUGS của NATO |

Ngoài ra còn: thiên tai, năng lượng và smart grid, giao thông, dưới nước, không gian, UAV.

### 4.8 Đổi mới công nghệ: 3 trụ cột

1. **Năng lượng:** thu năng lượng mặt trời (MPPT), áp điện, nhiệt điện, kết hợp nhiều nguồn; **wake-up radio** (node ngủ hẳn, chỉ thức khi có tín hiệu gọi).
2. **Truyền thông:** TSCH (nhảy kênh, chống nhiễu), liên kết âm thanh–quang học dưới nước, 6LoWPAN/RPL để node có địa chỉ IPv6.
3. **Trí tuệ và bảo mật:**
   - **TinyML:** chạy mô hình AI ngay trên vi điều khiển.
   - **Federated learning:** các node cùng huấn luyện mô hình mà không gửi dữ liệu thô.
   - **Fog computing:** xử lý ở tầng trung gian giữa node và cloud.
   - **Bảo mật:** mã hóa nhẹ (ECC), blockchain, phát hiện xâm nhập (IDS) bằng ML.

Thêm: **Software-defined WSN** (tách phần điều khiển ra để lập trình được; còn vướng chi phí điều khiển) và phần cứng mới (LoRa, nanosensor, smart sensor).

### 4.9 Chín thách thức còn tồn tại

Năng lượng · khả năng mở rộng và tắc nghẽn · nhiễu · bảo mật cho node yếu · quyền riêng tư (HIPAA, GDPR) · quá tải dữ liệu · chuẩn hóa · độ trễ/QoS · chi phí bảo trì.

**Nhận xét rút ra:** gần như **mọi giải pháp đề xuất** (clustering bằng ML, blockchain, federated learning…) đều **cần thêm tính toán, bộ nhớ hoặc năng lượng**, mà đó lại chính là thứ node cảm biến thiếu nhất.

### 4.10 Xu hướng tương lai

Mỗi xu hướng được paper gắn nhãn **loại tiến bộ cần có**:

| Xu hướng | Cần tiến bộ về |
|---|---|
| Node tự duy trì năng lượng | Phần cứng + thuật toán |
| Giao thức nhận biết ngữ cảnh (dùng ML) | Thuật toán |
| Trí tuệ cộng tác / federated learning | Thuật toán + kiến trúc |
| Kiến trúc lấy cảm hứng sinh học (swarm…) | Thuật toán |
| Digital twin (bản sao số) | Kiến trúc |
| Quantum sensing, QKD | Phần cứng (dài hạn) |
| WSN ở môi trường khắc nghiệt | Phần cứng chịu đựng, giao thức |
| Bảo mật/quyền riêng tư nâng cao | Thuật toán bảo mật, lý thuyết |
| Hợp nhất dữ liệu đa cảm biến | Thuật toán fusion |

---

## 5. Cấu trúc report (`report/WSN_Summary_Report.docx`)

| Mục | Nội dung | Ứng với paper |
|---|---|---|
| 1. Introduction | Thông tin paper, động lực, đóng góp | Section I |
| 2. Fundamentals | Kiến trúc, gộp dữ liệu, mô hình năng lượng, MAC, routing, ước lượng | Section II |
| 3. Applications | 12 lĩnh vực và case study | Section III |
| 4. Innovations | Các đổi mới | Section IV |
| 5. Challenges | 9 thách thức | Section V |
| 6. Future Trends | Hướng nghiên cứu | Section VI |
| **7. Critical Discussion** | **Phần của riêng mình:** điểm mạnh/yếu, ví dụ tính toán, liên hệ đề bài | — |
| 8. Conclusion + References | | Section VII |

Report có 10 bảng và 8 công thức. Trong Word, mọi trích dẫn `[n]`, “Eq. (n)”, “Table n”, “Section n” đều **Ctrl + Click** được để nhảy tới đúng chỗ.

---

## 6. Phần đóng góp riêng: đánh giá và ví dụ tính toán

### 6.1 Đánh giá paper

| Điểm mạnh | Hạn chế |
|---|---|
| Cấu trúc rõ ràng, phủ từ cơ bản tới tương lai | **Không có đánh giá định lượng** (không mô phỏng, không số liệu so sánh) |
| Góc nhìn năng lượng thống nhất | Công thức năng lượng quá trừu tượng (thiếu khoảng cách, kênh, va chạm) |
| Mỗi lĩnh vực có dự án thực tế | Không nêu phương pháp làm survey (tìm ở đâu, chọn bài theo tiêu chí nào) |
| Tỉnh táo về công nghệ đang “hot” (quantum, blockchain PoW…) | Rộng nhưng nông: nhiều giao thức chỉ được nhắc 1 câu |
| Lộ trình tương lai có phân loại | Một chỗ phân loại MAC không nhất quán |

### 6.2 Ví dụ: phân cụm (hub) có luôn tiết kiệm năng lượng không?

Đây là phần **trả lời câu hỏi 2 của đề bài** bằng tính toán thay vì mô phỏng.

**Mô hình radio bậc nhất** (first-order radio model, chuẩn trong các bài về LEACH):

- Gửi k bit đi xa d mét tốn: `E_Tx = k·E_elec + k·ε·dⁿ`
  - n = 2 khi d < ~88 m (truyền tự do)
  - n = 4 khi d ≥ ~88 m (đa đường, suy hao rất nhanh)
- Nhận k bit tốn: `E_Rx = k·E_elec`
- Tham số: E_elec = 50 nJ/bit, ε_fs = 10 pJ/bit/m², ε_mp = 0.0013 pJ/bit/m⁴, gộp dữ liệu tốn 5 nJ/bit.

**Thiết lập:** 100 node, gói 4000 bit, so sánh hai cách:

- (a) Mọi node gửi thẳng về sink ở khoảng cách d_BS.
- (b) Chia 5 cụm × 20 node; 19 thành viên gửi cho CH cách 20 m; CH gộp 20 số đo thành 1 gói rồi gửi về sink.

**Kết quả** (năng lượng mỗi vòng thu thập dữ liệu):

| Sink cách | Gửi thẳng | Phân cụm | Phân cụm tiết kiệm |
|---|---|---|---|
| 30 m | 23.6 mJ | 42.7 mJ | **−81 %** (tốn hơn!) |
| 60 m | 34.4 mJ | 43.2 mJ | −26 % |
| 90 m | 54.1 mJ | 44.2 mJ | +18 % |
| 100 m | 72.0 mJ | 45.1 mJ | **+37 %** |
| 150 m | 283.3 mJ | 55.7 mJ | **+80 %** |

**Kết luận rút ra:**

1. **Hub chỉ có lợi khi sink ở xa.** Lúc sink ở gần, chi phí CH phải nhận và gộp dữ liệu còn lớn hơn phần tiết kiệm được. Khi sink ở xa (vùng d⁴), thay 100 lần gửi xa bằng 5 lần gửi xa thì tiết kiệm rất lớn.
2. **CH tiêu thụ gấp ~23 lần node thường**, nên phải **luân phiên vai trò CH** (như LEACH) hoặc chọn CH theo năng lượng còn lại (như HEED), nếu không CH sẽ chết sớm.
3. Các công thức của paper **không thể hiện được** hai điều trên vì thiếu biến khoảng cách. Đây là minh chứng cụ thể cho hạn chế đã nêu ở 6.1.

### 6.3 Liên hệ với 2 câu hỏi simulation của đề

| Câu hỏi | Paper nói gì | Report bổ sung |
|---|---|---|
| Mạng dày đặc → contention, PDR? | Chỉ định tính: CSMA/CA va chạm nhiều khi dày; giải pháp là RTS/CTS, TSCH, Z-MAC, phân cụm | Chỉ ra số hạng collision trong mô hình năng lượng CSMA/CA; nếu muốn có số liệu PDR thì cần mô phỏng (NS-3, OMNeT++) |
| Many-to-one với hub có tiết kiệm năng lượng? | Nói phân cụm giảm truyền xa nhưng tăng tải cho CH | **Ví dụ tính toán:** có lợi khi hub–sink đủ xa; CH cần luân phiên |

---

## 7. Slide thuyết trình (`slides/WSN_Presentation.pptx`)

14 slide, khoảng 13 phút, theo template HUST:

Title → Outline → Paper at a glance → Why this survey → Architectures → Energy models → MAC & Routing → Applications → Innovations → Challenges & Future → Critical assessment → **Worked example (biểu đồ)** → Conclusion → Thank you.

Lời nói cho từng slide nằm ở `slides/speaker_notes.md` (tiếng Việt) và cũng có sẵn trong Presenter View của PowerPoint.

---

## 8. Build lại sản phẩm

```bash
# Report (.docx)
cd report && npm install && node build_report.js

# Slide (.pptx) + speaker notes (.md)
python3 -m venv .venv && .venv/bin/pip install python-pptx
.venv/bin/python slides/build_slides.py
```
