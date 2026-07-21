# JD Builder API Documentation

Tài liệu mô tả bộ API **JD Builder** — chatbot hỗ trợ xây dựng Job Description (JD) theo phiên hội thoại (session-based).

---

## Mục lục

- [1. Tạo session mới](#1-post-v2jd-builderstart)
- [2. Gửi tin nhắn trong session](#2-post-v2jd-builderchat)
- [3. Lấy trạng thái session](#3-get-v2jd-buildersessionsession_id)
- [4. Chốt JD (Finalize)](#4-post-v2jd-builderfinalize)
- [5. Chốt JD kèm dịch đa ngôn ngữ](#5-post-v2jd-builderfinalizetranslate)
- [Phụ lục: Schema JD đầy đủ](#phụ-lục-schema-jd-đầy-đủ)
- [Phụ lục: Validation Error Schema](#phụ-lục-validation-error-schema)

---

## 1. `POST /v2/jd-builder/start`

**Mô tả:** Tạo session chatbot mới để xây dựng JD.

### Request Body

| Field | Type | Mô tả |
|---|---|---|
| `company_name` | `string` | Tên công ty |
| `locale` | `string` | Ngôn ngữ hội thoại (ví dụ: `"vi"`) |
| `initial_brief` | `string` | Mô tả sơ bộ ban đầu về vị trí tuyển dụng |

**Ví dụ:**
```json
{
  "company_name": "string",
  "locale": "vi",
  "initial_brief": "string"
}
```

### Response — `200 OK`

| Field | Type | Mô tả |
|---|---|---|
| `session_id` | `string` | ID định danh session vừa tạo |
| `reply` | `string` | Câu trả lời/phản hồi từ chatbot |
| `draft` | `object` | Bản nháp JD hiện tại (dạng object động) |
| `missing_fields` | `array[string]` | Danh sách các trường thông tin còn thiếu |
| `can_finalize` | `boolean` | Đã đủ điều kiện để chốt JD hay chưa |
| `quick_replies` | `array[string]` | Gợi ý câu trả lời nhanh cho người dùng |

```json
{
  "session_id": "string",
  "reply": "string",
  "draft": {
    "additionalProp1": {}
  },
  "missing_fields": ["string"],
  "can_finalize": false,
  "quick_replies": ["string"]
}
```

### Response — `422 Validation Error`

Xem [Validation Error Schema](#phụ-lục-validation-error-schema).

---

## 2. `POST /v2/jd-builder/chat`

**Mô tả:** Gửi tin nhắn trong session và nhận phản hồi + draft JD cập nhật.

### Request Body

| Field | Type | Mô tả |
|---|---|---|
| `session_id` | `string` | ID của session đã tạo trước đó |
| `message` | `string` | Nội dung tin nhắn người dùng gửi |

```json
{
  "session_id": "string",
  "message": "string"
}
```

### Response — `200 OK`

| Field | Type | Mô tả |
|---|---|---|
| `session_id` | `string` | ID session |
| `reply` | `string` | Phản hồi mới nhất từ chatbot |
| `draft` | `object` | Bản nháp JD đã cập nhật |
| `missing_fields` | `array[string]` | Các trường còn thiếu |
| `can_finalize` | `boolean` | Đã đủ điều kiện chốt JD hay chưa |
| `quick_replies` | `array[string]` | Gợi ý trả lời nhanh |
| `messages` | `array[object]` | Lịch sử tin nhắn (xem bảng bên dưới) |

**Cấu trúc từng phần tử trong `messages`:**

| Field | Type | Mô tả |
|---|---|---|
| `role` | `string` | Vai trò gửi tin nhắn (`"user"` hoặc `"assistant"`) |
| `content` | `string` | Nội dung tin nhắn |

```json
{
  "session_id": "string",
  "reply": "string",
  "draft": {
    "additionalProp1": {}
  },
  "missing_fields": ["string"],
  "can_finalize": false,
  "quick_replies": ["string"],
  "messages": [
    {
      "role": "user",
      "content": "string"
    }
  ]
}
```

### Response — `422 Validation Error`

Xem [Validation Error Schema](#phụ-lục-validation-error-schema).

---

## 3. `GET /v2/jd-builder/session/{session_id}`

**Mô tả:** Lấy trạng thái hiện tại của session (draft, lịch sử tin nhắn, các trường còn thiếu).

### Path Parameter

| Param | Type | Mô tả |
|---|---|---|
| `session_id` | `string` | ID của session cần truy vấn |

### Response — `200 OK`

| Field | Type | Mô tả |
|---|---|---|
| `session_id` | `string` | ID session |
| `draft` | `object` | Bản nháp JD hiện tại |
| `missing_fields` | `array[string]` | Các trường còn thiếu |
| `can_finalize` | `boolean` | Đã đủ điều kiện chốt JD hay chưa |
| `messages` | `array[object]` | Lịch sử hội thoại (`role`, `content`) |
| `company_name` | `string` | Tên công ty |
| `locale` | `string` | Ngôn ngữ session |

```json
{
  "session_id": "string",
  "draft": {
    "additionalProp1": {}
  },
  "missing_fields": ["string"],
  "can_finalize": false,
  "messages": [
    {
      "role": "user",
      "content": "string"
    }
  ],
  "company_name": "string",
  "locale": "vi"
}
```

### Response — `422 Validation Error`

Xem [Validation Error Schema](#phụ-lục-validation-error-schema).

---

## 4. `POST /v2/jd-builder/finalize`

**Mô tả:** Chốt hội thoại thành JD có cấu trúc (structured) theo schema JD chuẩn.

### Request Body

| Field | Type | Mô tả |
|---|---|---|
| `session_id` | `string` | ID session cần chốt |

```json
{
  "session_id": "string"
}
```

### Response — `200 OK`

| Field | Type | Mô tả |
|---|---|---|
| `session_id` | `string` | ID session |
| `jd` | `object` | JD hoàn chỉnh theo [Schema JD](#phụ-lục-schema-jd-đầy-đủ) |

```json
{
  "session_id": "string",
  "jd": { "...": "xem Schema JD đầy đủ" }
}
```

### Response — `422 Validation Error`

Xem [Validation Error Schema](#phụ-lục-validation-error-schema).

---

## 5. `POST /v2/jd-builder/finalize/translate`

**Mô tả:** Tương tự `finalize`, nhưng trả về thêm bản dịch JD sang nhiều ngôn ngữ (`vi`, `en`, `jp`).

### Request Body

| Field | Type | Mô tả |
|---|---|---|
| `session_id` | `string` | ID session cần chốt |

```json
{
  "session_id": "string"
}
```

### Response — `200 OK`

| Field | Type | Mô tả |
|---|---|---|
| `session_id` | `string` | ID session |
| `jd` | `object` | JD gốc theo [Schema JD](#phụ-lục-schema-jd-đầy-đủ) |
| `jd_output` | `object` | JD đã dịch, gồm 3 khóa: `vi`, `en`, `jp` — mỗi khóa là một object JD đầy đủ |

```json
{
  "session_id": "string",
  "jd": { "...": "xem Schema JD đầy đủ" },
  "jd_output": {
    "vi": { "...": "JD đầy đủ (tiếng Việt)" },
    "en": { "...": "JD đầy đủ (tiếng Anh)" },
    "jp": { "...": "JD đầy đủ (tiếng Nhật)" }
  }
}
```

### Response — `422 Validation Error`

Xem [Validation Error Schema](#phụ-lục-validation-error-schema).

---

## Phụ lục: Schema JD đầy đủ

Cấu trúc object `jd` được dùng chung trong các endpoint `finalize` và `finalize/translate`:

| Field | Type | Mô tả |
|---|---|---|
| `job_code` | `string` | Mã công việc |
| `job_title` | `string` | Chức danh công việc |
| `content_language` | `string` | Ngôn ngữ nội dung (ví dụ: `"ja"`) |
| `industry` | `integer` | Mã ngành nghề |
| `job_category` | `integer` | Mã danh mục công việc |
| `employment_type` | `integer` | Loại hình việc làm |
| `visa_status` | `string` | Tình trạng visa yêu cầu |
| `accepted_visa_types` | `array[string]` | Danh sách loại visa được chấp nhận |
| `headcount` | `integer` | Số lượng tuyển |
| `experience_job` | `string` | Kinh nghiệm công việc yêu cầu |
| `experience_industry` | `string` | Kinh nghiệm ngành yêu cầu |
| `features` | `array[string]` | Đặc điểm nổi bật của công việc |
| `description` | `string` | Mô tả công việc |
| `hiring_reason` | `string` | Lý do tuyển dụng |
| `requirements_must` | `array[string]` | Yêu cầu bắt buộc |
| `requirements_preferred` | `array[string]` | Yêu cầu ưu tiên |
| `salary` | `object` | Thông tin lương (xem bên dưới) |
| `location` | `string` | Địa điểm làm việc |
| `location_detail` | `string` | Chi tiết địa điểm |
| `working_hours` | `array[string]` | Giờ làm việc |
| `working_hour_detail` | `string` | Chi tiết giờ làm việc |
| `rest_time` | `string` | Thời gian nghỉ |
| `overtime_details` | `string` | Chi tiết làm thêm giờ |
| `overtime_fee` | `string` | Phụ cấp làm thêm giờ |
| `benefits` | `array[string]` | Phúc lợi |
| `social_insurance` | `string` | Bảo hiểm xã hội |
| `transportation` | `string` | Hỗ trợ đi lại |
| `holidays` | `string` | Ngày nghỉ lễ |
| `holiday_detail` | `string` | Chi tiết ngày nghỉ |
| `probation` | `string` | Thời gian thử việc |
| `probation_detail` | `string` | Chi tiết thử việc |
| `recruitment_process` | `string` | Quy trình tuyển dụng |
| `company` | `object` | Thông tin công ty (xem bên dưới) |

### Object `salary`

| Field | Type | Mô tả |
|---|---|---|
| `currency` | `integer` | Mã loại tiền tệ |
| `monthly` | `string` | Lương tháng |
| `yearly` | `string` | Lương năm |
| `salary_details` | `string` | Chi tiết lương |
| `bonus_details` | `string` | Chi tiết thưởng |
| `raise_details` | `string` | Chi tiết tăng lương |

### Object `company`

| Field | Type | Mô tả |
|---|---|---|
| `name` | `string` | Tên công ty |
| `listing_status` | `string` | Tình trạng niêm yết |
| `industry_class` | `string` | Phân loại ngành |
| `revenue` | `string` | Doanh thu |
| `capital` | `string` | Vốn điều lệ |
| `employee_count` | `string` | Số lượng nhân viên |
| `established_year` | `string` | Năm thành lập |
| `headquarter` | `string` | Trụ sở chính |
| `overview` | `string` | Tổng quan công ty |

---

## Phụ lục: Validation Error Schema

Áp dụng chung cho tất cả response `422` của các endpoint trên:

| Field | Type | Mô tả |
|---|---|---|
| `detail` | `array[object]` | Danh sách lỗi validation |
| `detail[].loc` | `array` | Vị trí trường bị lỗi (tên trường + index) |
| `detail[].msg` | `string` | Thông báo lỗi |
| `detail[].type` | `string` | Loại lỗi |

```json
{
  "detail": [
    {
      "loc": ["string", 0],
      "msg": "string",
      "type": "string"
    }
  ]
}
```

---

## Tổng quan luồng sử dụng

```
1. POST /v2/jd-builder/start
        │  (tạo session, nhận session_id)
        ▼
2. POST /v2/jd-builder/chat  ◄──┐
        │  (lặp lại nhiều lần    │
        │   cho đến khi          │
        │   can_finalize = true) │
        └────────────────────────┘
        ▼
3. GET /v2/jd-builder/session/{session_id}
        │  (tùy chọn — kiểm tra trạng thái session)
        ▼
4. POST /v2/jd-builder/finalize
        │  hoặc
        ▼
5. POST /v2/jd-builder/finalize/translate
        (nhận JD hoàn chỉnh, có thể kèm bản dịch đa ngôn ngữ)
```
