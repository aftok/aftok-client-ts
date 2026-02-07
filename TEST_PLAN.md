# Aftok UI Test Plan

Pre-production testing checklist for the Aftok web application (TypeScript React client).

**Test Environment:** http://aftok.local:30080
**Date:** _______________
**Tester:** _______________

---

## 1. Authentication

### 1.1 Login
- [ ] Navigate to `/app/login`
- [ ] Page loads without errors
- [ ] Username field accepts input
- [ ] Password field accepts input and masks characters
- [ ] Login with valid credentials succeeds
- [ ] Login redirects to Overview page after success
- [ ] Login with invalid credentials shows error message
- [ ] Login with empty fields shows validation error
- [ ] "Forgot password" link is visible and navigates to password reset
- [ ] "Sign up" link is visible and navigates to signup

### 1.2 Logout
- [ ] Logout button is visible in the navigation bar when logged in
- [ ] Clicking logout clears session
- [ ] After logout, protected pages redirect to login
- [ ] After logout, cannot access API endpoints (401 returned)

### 1.3 Signup
- [ ] Navigate to `/app/signup`
- [ ] Page loads without errors
- [ ] All required fields are present (username, email/zcash address, password, confirm password)
- [ ] Email/Zcash address toggle works correctly
- [ ] Email validation works (rejects invalid formats)
- [ ] Password confirmation must match
- [ ] Signup with valid data succeeds
- [ ] Signup with existing username shows appropriate error
- [ ] CAPTCHA (if enabled) functions correctly
- [ ] Invitation code from URL parameter is accepted (e.g., `/app/signup?invcode=...`)

### 1.4 Password Reset Request
- [ ] Navigate to password reset page from login
- [ ] Email field accepts input
- [ ] Submit with valid email shows success message
- [ ] Submit with invalid email format shows error
- [ ] Email is received (check Mailpit)

### 1.5 Password Reset Confirmation
- [ ] Click reset link from email
- [ ] Page loads at `/app/reset-confirm/:token` with token from URL
- [ ] New password field accepts input
- [ ] Confirm password field accepts input
- [ ] Passwords must match validation works
- [ ] Minimum password length (8 characters) is enforced
- [ ] Successful reset redirects to login
- [ ] Can login with new password
- [ ] Old password no longer works
- [ ] Expired/invalid token shows appropriate error

---

## 2. Project Management

### 2.1 Project Selector
- [ ] Project dropdown displays correctly (text not cut off)
- [ ] All user's projects appear in dropdown
- [ ] Selecting a project updates the view
- [ ] First project is auto-selected on initial load
- [ ] Selected project persists when navigating between pages

### 2.2 Create Project
- [ ] "Create a new project" button is visible on Overview page
- [ ] Create project modal opens
- [ ] Project name field accepts input
- [ ] Undepreciated period field accepts numeric input
- [ ] Depreciation duration field accepts numeric input
- [ ] Validation errors display for missing/invalid input
- [ ] Creating project with valid data succeeds and modal closes
- [ ] New project appears in project dropdown
- [ ] New project is automatically selected after creation

### 2.3 Project Overview
- [ ] Navigate to Overview page (`/app/overview`)
- [ ] Project details display correctly:
  - [ ] Project Name
  - [ ] Undepreciated Period
  - [ ] Depreciation Duration
  - [ ] Originator
  - [ ] Origination Date
- [ ] Contributor list displays correctly:
  - [ ] Contributor names
  - [ ] Join dates
  - [ ] Hours contributed
  - [ ] After depreciation hours
  - [ ] Revenue share percentages
- [ ] Contributors sorted by revenue share (descending)

### 2.4 Invite Collaborator
- [ ] "Invite a collaborator" button is visible
- [ ] Invite modal opens
- [ ] Name field accepts input
- [ ] Message field accepts input
- [ ] Email/Zcash address toggle works
- [ ] Sending invite succeeds
- [ ] Zcash invite displays ZIP321 QR code / URI
- [ ] Invite email is received by recipient (check Mailpit)

---

## 3. Timeline / Time Tracking

### 3.1 Timeline View
- [ ] Navigate to Timeline page (`/app/timeline`)
- [ ] Project selector is present and functions correctly
- [ ] "Select a project" prompt shows when no project selected

### 3.2 Start/Stop Work Session
- [ ] "Start Work" button is enabled when no session is active
- [ ] Clicking "Start Work" begins a work session
- [ ] Elapsed time counter appears and increments every second
- [ ] "Start Work" button is disabled while session is active
- [ ] "Stop Work" button is enabled while session is active
- [ ] Clicking "Stop Work" ends the work session
- [ ] Elapsed time counter disappears after stopping
- [ ] Completed session appears as an interval bar in the day row

### 3.3 Work History
- [ ] Previous work sessions display as day rows
- [ ] Days are sorted in reverse chronological order
- [ ] Each day shows interval count and total time
- [ ] Interval bars are positioned correctly within the day
- [ ] Active interval bar is green; completed intervals are orange
- [ ] Hovering over a bar shows start/end times in tooltip
- [ ] Intervals spanning midnight are split across day rows

---

## 4. Billing

### 4.1 Billing Overview
- [ ] Navigate to Billing page (`/app/billing`)
- [ ] Project selector is present and functions correctly
- [ ] Billable list displays for selected project
- [ ] Each billable shows name, description, ZEC amount, and recurrence

### 4.2 Create Billable
- [ ] "Create billable" button is visible
- [ ] Create billable modal opens
- [ ] Product name field accepts input
- [ ] Description field accepts input
- [ ] Message field accepts input
- [ ] Recurrence radio buttons work (annually, monthly, weekly, one-time)
- [ ] Monthly/weekly recurrence shows number input
- [ ] Amount field accepts ZEC values
- [ ] Grace period field accepts numeric input (days)
- [ ] Request expiry field accepts numeric input (hours)
- [ ] Validation errors display for missing/invalid fields
- [ ] Creating billable succeeds and modal closes
- [ ] New billable appears in the list

### 4.3 Payment Requests
- [ ] "New payment request" link is visible for each billable
- [ ] Payment request modal opens
- [ ] Request name field accepts input
- [ ] Description field accepts input (optional)
- [ ] Creating payment request succeeds
- [ ] Modal switches to QR display mode showing ZIP321 URI
- [ ] ZIP321 URI is displayed correctly
- [ ] Close button returns to billing list

---

## 5. Cross-Cutting Concerns

### 5.1 Navigation
- [ ] All navigation bar links work (Overview, Timeline, Billing)
- [ ] Active page is highlighted in navigation bar
- [ ] Browser back/forward buttons work correctly
- [ ] Deep linking to specific pages works (e.g., `/app/timeline`)
- [ ] Navigating to `/app/` redirects to Overview (if logged in) or Login
- [ ] Navigating to unknown paths redirects to Login

### 5.2 Responsive Design
- [ ] Application displays correctly on desktop (1920x1080)
- [ ] Application displays correctly on laptop (1366x768)
- [ ] Application displays correctly on tablet (768x1024)
- [ ] Application displays correctly on mobile (375x667)

### 5.3 Error Handling
- [ ] Network errors display user-friendly messages
- [ ] API errors display appropriate messages
- [ ] 401 errors redirect to login
- [ ] 403 errors show access denied message
- [ ] 500 errors show generic error message

### 5.4 Session Management
- [ ] Session persists across page refreshes
- [ ] Session persists across browser tabs
- [ ] Session expires appropriately (check cookie timeout — 24 hours)
- [ ] XSRF token is sent with POST/PUT/DELETE requests
- [ ] XSRF token is correctly parsed (including tokens with `=` characters)

### 5.5 Security
- [ ] HTTPS redirect works (production only)
- [ ] Cookies have appropriate flags (Secure, SameSite=Strict)
- [ ] CORS only allows configured origins
- [ ] Cannot access other users' data
- [ ] Cannot access other users' projects

---

## 6. Browser Compatibility

### 6.1 Chrome (latest)
- [ ] All features function correctly
- [ ] No console errors

### 6.2 Firefox (latest)
- [ ] All features function correctly
- [ ] No console errors

### 6.3 Safari (latest)
- [ ] All features function correctly
- [ ] No console errors

### 6.4 Edge (latest)
- [ ] All features function correctly
- [ ] No console errors

---

## 7. Performance

- [ ] Initial page load < 3 seconds
- [ ] API responses < 1 second
- [ ] No memory leaks during extended use (timeline timer cleanup)
- [ ] No excessive network requests

---

## Notes

_Use this section to record any issues, observations, or bugs found during testing._

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
|       |          |             |        |

---

## Sign-off

- [ ] All critical features tested
- [ ] All blocking issues resolved
- [ ] Ready for production deployment

**Approved by:** _______________
**Date:** _______________
