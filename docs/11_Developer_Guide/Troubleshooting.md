# Troubleshooting Guide
> Common errors, causes, and fixes for the InsuranceFlow system.

---

## Purpose
To quickly diagnose and resolve environment, runtime, and integration issues during development and deployment.

---

## Quick Reference Fix Table

| Symptom | Cause | Fix |
|---------|-------|-----|
| Backend fails to boot (`ConnectionRefused`) | MySQL or Redis is down. | Start MySQL and Redis. Check ports 3306/6379. |
| `Access Denied for user root` | Bad DB credentials. | Update `application.properties` DB username/password. |
| JWT Signature Exception | Secret key mismatch. | Ensure frontend and backend are using tokens from the current boot session. Clear browser cookies. |
| 401 Unauthorized on every request | Token expired and refresh failed. | Check if Redis is running (used for token validation). |
| 403 Forbidden | Missing specific `@PreAuthorize` role. | Ensure user has `ROLE_ADMIN` or `ROLE_INTERNAL_STAFF`. |
| CORS Error in browser console | Backend doesn't recognize frontend origin. | Update Spring `WebMvcConfigurer` to include the frontend URL. |
| Frontend Blank Page | JS error on mount or missing Env var. | Check DevTools Console. Ensure `VITE_API_BASE_URL` is set. |
| 404 on page refresh (Frontend) | React Router SPA issue. | If on Nginx, ensure `try_files $uri /index.html` is set. |
| MailSendException | Bad SMTP credentials or App Password. | Generate a new Google App Password. Do not use standard password. |
| Twilio Exception | Unverified phone number (Trial account). | Verify the destination phone number in the Twilio console. |
| 429 Too Many Requests | Hit Bucket4j rate limit. | Wait 1 minute for bucket refill, or restart backend. |
| Data truncation / Data too long | DB column constraint hit. | Ensure input length matches entity `@Column(length=X)`. |
| OptimisticLockException | Concurrent claim modification. | Normal behavior. Refresh page to get latest version and try again. |
| jsPDF generation hangs | Document size too large. | Reduce image payload size inside the PDF generation script. |
| Cloudinary Upload Fails | Bad API keys or blocked outbound port. | Verify `.env` keys. Ensure network allows outbound to Cloudinary API. |

---

## Deep Dives

### Common Redis Issues
If the backend logs show `JedisConnectionException`:
- **Windows:** Memurai service might be stopped. Open Services -> Start Memurai.
- **Mac:** `brew services start redis`
- **Fix:** You can temporarily comment out the Redis token filter in `SecurityConfig` for UI testing, though logout will break.

### Common JWT / CORS Issues
If you see CORS errors specifically on the `/refresh` endpoint:
- **Cause:** The browser is blocking the request because the HttpOnly cookie is attached across origins without `allowCredentials=true`.
- **Fix:** Ensure both Axios `withCredentials: true` is set, and Spring Boot CORS configuration explicitly allows the frontend origin and sets `allowCredentials(true)`.

### Common MySQL Issues
If you see `Table 'insurance_db.user' doesn't exist`:
- **Cause:** `ddl-auto` is set to `none` or `validate` but the tables aren't created.
- **Fix:** Change `ddl-auto=update` in application.properties and restart.
