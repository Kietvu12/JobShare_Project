# JD Builder API

```
/v2/jd-builder/start
Tạo session chatbot mới để xây dựng JD.

{
  "company_name": "string",
  "locale": "vi",
  "initial_brief": "string"
}

200	
Successful Response
{
  "session_id": "string",
  "reply": "string",
  "draft": {
    "additionalProp1": {}
  },
  "missing_fields": [
    "string"
  ],
  "can_finalize": false,
  "quick_replies": [
    "string"
  ]
}
Code	Description	Links
200	
Successful Response

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "session_id": "string",
  "reply": "string",
  "draft": {
    "additionalProp1": {}
  },
  "missing_fields": [
    "string"
  ],
  "can_finalize": false,
  "quick_replies": [
    "string"
  ]
}
422	
Validation Error
{
  "detail": [
    {
      "loc": [
        "string",
        0
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}
======================================================================
/v2/jd-builder/chat
Gửi tin nhắn trong session và nhận phản hồi + draft JD cập nhật.
{
  "session_id": "string",
  "message": "string"
}

200	
Successful Response
{
  "session_id": "string",
  "reply": "string",
  "draft": {
    "additionalProp1": {}
  },
  "missing_fields": [
    "string"
  ],
  "can_finalize": false,
  "quick_replies": [
    "string"
  ],
  "messages": [
    {
      "role": "user",
      "content": "string"
    }
  ]
}
422	
Validation Error
{
  "detail": [
    {
      "loc": [
        "string",
        0
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}
================================================================
/v2/jd-builder/session/{session_id}

Lấy trạng thái session (draft, messages, missing fields).
200	
Successful Response
{
  "session_id": "string",
  "draft": {
    "additionalProp1": {}
  },
  "missing_fields": [
    "string"
  ],
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
422	
Validation Error
{
  "detail": [
    {
      "loc": [
        "string",
        0
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}
============================================================
/v2/jd-builder/finalize
Chốt hội thoại thành JD structured (schema JD).
{
  "session_id": "string"
}
200	
Successful Response
{
  "session_id": "string",
  "jd": {
    "job_code": "string",
    "job_title": "string",
    "content_language": "ja",
    "industry": 1,
    "job_category": 1,
    "employment_type": 1,
    "visa_status": "string",
    "accepted_visa_types": [
      "string"
    ],
    "headcount": 0,
    "experience_job": "string",
    "experience_industry": "string",
    "features": [
      "string"
    ],
    "description": "string",
    "hiring_reason": "string",
    "requirements_must": [
      "string"
    ],
    "requirements_preferred": [
      "string"
    ],
    "salary": {
      "currency": 1,
      "monthly": "string",
      "yearly": "string",
      "salary_details": "string",
      "bonus_details": "string",
      "raise_details": "string"
    },
    "location": "string",
    "location_detail": "string",
    "working_hours": [
      "string"
    ],
    "working_hour_detail": "string",
    "rest_time": "string",
    "overtime_details": "string",
    "overtime_fee": "string",
    "benefits": [
      "string"
    ],
    "social_insurance": "string",
    "transportation": "string",
    "holidays": "string",
    "holiday_detail": "string",
    "probation": "string",
    "probation_detail": "string",
    "recruitment_process": "string",
    "company": {
      "name": "string",
      "listing_status": "string",
      "industry_class": "string",
      "revenue": "string",
      "capital": "string",
      "employee_count": "string",
      "established_year": "string",
      "headquarter": "string",
      "overview": "string"
    }
  }
}
422	
Validation Error
{
  "detail": [
    {
      "loc": [
        "string",
        0
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}
=======================================================================
/v2/jd-builder/finalize/translate
{
  "session_id": "string"
}
200	
Successful Response
{
  "session_id": "string",
  "jd": {
    "job_code": "string",
    "job_title": "string",
    "content_language": "ja",
    "industry": 1,
    "job_category": 1,
    "employment_type": 1,
    "visa_status": "string",
    "accepted_visa_types": [
      "string"
    ],
    "headcount": 0,
    "experience_job": "string",
    "experience_industry": "string",
    "features": [
      "string"
    ],
    "description": "string",
    "hiring_reason": "string",
    "requirements_must": [
      "string"
    ],
    "requirements_preferred": [
      "string"
    ],
    "salary": {
      "currency": 1,
      "monthly": "string",
      "yearly": "string",
      "salary_details": "string",
      "bonus_details": "string",
      "raise_details": "string"
    },
    "location": "string",
    "location_detail": "string",
    "working_hours": [
      "string"
    ],
    "working_hour_detail": "string",
    "rest_time": "string",
    "overtime_details": "string",
    "overtime_fee": "string",
    "benefits": [
      "string"
    ],
    "social_insurance": "string",
    "transportation": "string",
    "holidays": "string",
    "holiday_detail": "string",
    "probation": "string",
    "probation_detail": "string",
    "recruitment_process": "string",
    "company": {
      "name": "string",
      "listing_status": "string",
      "industry_class": "string",
      "revenue": "string",
      "capital": "string",
      "employee_count": "string",
      "established_year": "string",
      "headquarter": "string",
      "overview": "string"
    }
  },
  "jd_output": {
    "vi": {
      "job_code": "string",
      "job_title": "string",
      "content_language": "ja",
      "industry": 1,
      "job_category": 1,
      "employment_type": 1,
      "visa_status": "string",
      "accepted_visa_types": [
        "string"
      ],
      "headcount": 0,
      "experience_job": "string",
      "experience_industry": "string",
      "features": [
        "string"
      ],
      "description": "string",
      "hiring_reason": "string",
      "requirements_must": [
        "string"
      ],
      "requirements_preferred": [
        "string"
      ],
      "salary": {
        "currency": 1,
        "monthly": "string",
        "yearly": "string",
        "salary_details": "string",
        "bonus_details": "string",
        "raise_details": "string"
      },
      "location": "string",
      "location_detail": "string",
      "working_hours": [
        "string"
      ],
      "working_hour_detail": "string",
      "rest_time": "string",
      "overtime_details": "string",
      "overtime_fee": "string",
      "benefits": [
        "string"
      ],
      "social_insurance": "string",
      "transportation": "string",
      "holidays": "string",
      "holiday_detail": "string",
      "probation": "string",
      "probation_detail": "string",
      "recruitment_process": "string",
      "company": {
        "name": "string",
        "listing_status": "string",
        "industry_class": "string",
        "revenue": "string",
        "capital": "string",
        "employee_count": "string",
        "established_year": "string",
        "headquarter": "string",
        "overview": "string"
      }
    },
    "en": {
      "job_code": "string",
      "job_title": "string",
      "content_language": "ja",
      "industry": 1,
      "job_category": 1,
      "employment_type": 1,
      "visa_status": "string",
      "accepted_visa_types": [
        "string"
      ],
      "headcount": 0,
      "experience_job": "string",
      "experience_industry": "string",
      "features": [
        "string"
      ],
      "description": "string",
      "hiring_reason": "string",
      "requirements_must": [
        "string"
      ],
      "requirements_preferred": [
        "string"
      ],
      "salary": {
        "currency": 1,
        "monthly": "string",
        "yearly": "string",
        "salary_details": "string",
        "bonus_details": "string",
        "raise_details": "string"
      },
      "location": "string",
      "location_detail": "string",
      "working_hours": [
        "string"
      ],
      "working_hour_detail": "string",
      "rest_time": "string",
      "overtime_details": "string",
      "overtime_fee": "string",
      "benefits": [
        "string"
      ],
      "social_insurance": "string",
      "transportation": "string",
      "holidays": "string",
      "holiday_detail": "string",
      "probation": "string",
      "probation_detail": "string",
      "recruitment_process": "string",
      "company": {
        "name": "string",
        "listing_status": "string",
        "industry_class": "string",
        "revenue": "string",
        "capital": "string",
        "employee_count": "string",
        "established_year": "string",
        "headquarter": "string",
        "overview": "string"
      }
    },
    "jp": {
      "job_code": "string",
      "job_title": "string",
      "content_language": "ja",
      "industry": 1,
      "job_category": 1,
      "employment_type": 1,
      "visa_status": "string",
      "accepted_visa_types": [
        "string"
      ],
      "headcount": 0,
      "experience_job": "string",
      "experience_industry": "string",
      "features": [
        "string"
      ],
      "description": "string",
      "hiring_reason": "string",
      "requirements_must": [
        "string"
      ],
      "requirements_preferred": [
        "string"
      ],
      "salary": {
        "currency": 1,
        "monthly": "string",
        "yearly": "string",
        "salary_details": "string",
        "bonus_details": "string",
        "raise_details": "string"
      },
      "location": "string",
      "location_detail": "string",
      "working_hours": [
        "string"
      ],
      "working_hour_detail": "string",
      "rest_time": "string",
      "overtime_details": "string",
      "overtime_fee": "string",
      "benefits": [
        "string"
      ],
      "social_insurance": "string",
      "transportation": "string",
      "holidays": "string",
      "holiday_detail": "string",
      "probation": "string",
      "probation_detail": "string",
      "recruitment_process": "string",
      "company": {
        "name": "string",
        "listing_status": "string",
        "industry_class": "string",
        "revenue": "string",
        "capital": "string",
        "employee_count": "string",
        "established_year": "string",
        "headquarter": "string",
        "overview": "string"
      }
    }
  }
}
422	
Validation Error
{
  "detail": [
    {
      "loc": [
        "string",
        0
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}



```
