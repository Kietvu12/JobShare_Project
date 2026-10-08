# QA checklist

## Functional
- [x] Home route `/`
- [x] Register route `/register`
- [x] Login endpoint `/ctv/auth/login`
- [x] Forgot endpoint `/ctv/auth/forgot-password`
- [x] token / userType / user storage retained
- [x] successful redirect `/agent`
- [x] existing CTV session redirect `/agent`
- [x] show/hide password
- [x] loading / disabled button state
- [x] backend error message surface
- [x] forgot-password in-page state
- [x] VI / EN / JA switch

## Accessibility
- semantic forms and labels
- email inputmode + autocomplete
- current-password autocomplete
- 16px mobile inputs
- focus states
- aria-live error/success regions
- password toggle aria-label / aria-pressed
- reduced-motion support

## Viewports to verify
1440, 1366, 1280, 1024, 768, 430, 390, 360.
