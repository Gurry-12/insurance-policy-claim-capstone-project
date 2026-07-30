# Complete Modification Guide

> **What:** A step-by-step guide on how to safely modify key areas of the application.
> **Why:** Prevents new developers from breaking the tightly coupled architectural flows when adding new features or changing existing ones.

---

## 1. How to Add a New API Endpoint

1. **Locate the Service File**: Go to `src/services/`. Find the appropriate entity file (e.g., `policyService.js` or `customerService.js`). If it's a completely new entity, create a new file (e.g., `notificationService.js`).
2. **Import Axios**: Ensure you import the configured `apiInstance`.
   ```javascript
   import apiInstance from "../api/axiosInstance";
   ```
3. **Write the Function**: Always return the `Promise` so the component can handle it.
   ```javascript
   export const fetchCustomData = async (params) => {
     // No need to try/catch here unless you are transforming the error specifically.
     // apiAdapter already standardizes the response.
     return await apiInstance.get("/custom-endpoint", { params });
   };
   ```
4. **Usage in Component**:
   ```javascript
   import { fetchCustomData } from '../../services/customService';
   
   // inside component or useEffect
   try {
     const data = await fetchCustomData({ page: 1 });
     setLocalState(data);
   } catch (err) {
     // err is already standardized by apiAdapter.
     notify.error(err); 
   }
   ```

## 2. How to Add a New Route & Protect It

1. **Open `src/App.jsx`**.
2. **Determine the Role**: Is this for Customer, Staff, or Admin?
3. **Find the Layout Wrapper**: Locate the `<Route element={<UserLayout />}>` block.
4. **Add the Protected Route**:
   ```jsx
   {/* Example: Adding a new Staff Route */}
   <Route 
     path="/staff/new-feature" 
     element={
       <RoleProtectedRoute allowedRoles={['ROLE_STAFF']}>
         <NewFeaturePage />
       </RoleProtectedRoute>
     } 
   />
   ```
5. **Update Navigation**: Go to `src/components/layout/Sidebar.jsx` and add the link so users can click it.

## 3. How to Add a New Form Field (Using `useApiForm`)

If you are modifying a form that uses the custom `useApiForm` hook (e.g., Issue Policy, Create Product):

1. **Locate Component State Initialization**:
   Find where `useApiForm` or `useState` is setting the initial `formData`.
   ```javascript
   const [formData, setFormData] = useState({
     existingField: '',
     newField: '' // Add it here
   });
   ```
2. **Add the Input UI**:
   Use standard inputs or `<ModernSelect>`. Ensure `name` exactly matches the state key.
   ```jsx
   <input 
     name="newField" 
     value={formData.newField} 
     onChange={handleChange} // Provided by useApiForm or local handler
   />
   {errors.newField && <span>{errors.newField}</span>}
   ```
3. **Update Validation Logic**:
   Locate the `handleSubmit` function.
   ```javascript
   if (!formData.newField) {
     errs.newField = 'New field is required';
   }
   ```

## 4. How to Modify Theme Colors

The application uses CSS variables defined in `src/index.css`.

1. **Open `src/index.css`**.
2. **Locate the `:root` pseudo-class**.
3. **Change the Hex Code**:
   ```css
   :root {
     /* Change primary brand color */
     --ip-primary: #0284c7; /* Blue */
     /* To change to purple, for instance: */
     /* --ip-primary: #7e22ce; */
   }
   ```
4. **Dark Mode Modifications**: Scroll down to the `[data-bs-theme="dark"]` block to adjust colors specifically for dark mode.

## 5. How to Handle File Upload Changes

If the backend changes the maximum file size or allowed types for Claims:

1. **Open `src/pages/customer/claims/UploadDocumentsPage.jsx`** and `RaiseClaimPage.jsx`.
2. **Find `handleFileChange`**:
   ```javascript
   const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
   const maxSize = 5 * 1024 * 1024; // 5MB
   ```
3. **Modify as Needed**: Change `maxSize` or add MIME types to `allowedTypes`.
4. **Update the UI Text**: Search for "Max 5MB" in the JSX and update the helper text.

## 6. Understanding the API Adapter (`apiAdapter.js`)

If the Java Backend changes its global `ApiResponseDTO` wrapper format (e.g., they rename `responseData` to `payload`), you ONLY need to change one file:

1. **Open `src/api/apiAdapter.js`**.
2. **Locate the `responseInterceptor`**.
3. **Modify the Extraction Logic**:
   ```javascript
   // Old
   const data = response.data?.responseData || response.data?.data || response.data;
   
   // New
   const data = response.data?.payload || response.data;
   ```
4. **Test Thoroughly**: This change will affect every single API call in the application.
