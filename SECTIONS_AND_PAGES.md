# Sections & Multi-Page Forms

## ✅ Features Implemented

### 1. 📑 Sections - Organize Fields into Groups

Break down complex forms into logical sections with headers and descriptions.

#### **Key Features:**
- **Section Headers** - Title and optional description for each section
- **Visual Separation** - Clear boundaries between sections
- **Collapsible Sections** (Single-page forms only)
- **Unlimited Sections** - Add as many as needed
- **Section Reordering** - Drag sections around (coming soon)

#### **Benefits:**
- Better form organization
- Easier for users to understand form structure
- Groups related fields together
- Improves form readability

---

### 2. 📄 Multi-Page Forms - Step-by-Step Data Collection

Split long forms into multiple pages with wizard-style navigation.

#### **Key Features:**
- **Multiple Pages** - Split form across 2-10+ pages
- **Progress Indicator** - Visual progress bar showing completion
- **Page Navigation** - Previous/Next buttons
- **Page Validation** - Must complete page before proceeding
- **Sections per Page** - Organize each page with sections
- **Responsive Design** - Works perfectly on mobile

#### **Benefits:**
- Reduces form abandonment
- Better user experience for long forms
- Focused data collection
- Clear progression through form
- Mobile-friendly navigation

---

## 🎯 How to Use

### **Creating Sections (Single-Page Forms):**

1. **In Form Builder:**
   - Default section "Basic Information" is created automatically
   - Click "Add Section" at the bottom
   - Enter section title and description
   - Toggle "Collapsible" if you want users to expand/collapse
   - Add fields to each section using "Add Field to This Section"
   - Remove sections with trash icon (fields move to first section)

2. **Field Assignment:**
   - Each field belongs to one section
   - Drag fields between sections (coming soon)
   - Fields display under their section header during submission

---

### **Creating Multi-Page Forms:**

1. **In Form Builder:**
   - Toggle "Multi-Page Form" switch at top
   - Set number of pages using +/- buttons
   - Each page gets its own tab in builder
   - Create sections within each page
   - Add fields to sections on each page

2. **Page Organization:**
   - Page 1: Basic information
   - Page 2: Detailed data
   - Page 3: Attachments & signatures
   - Page 4: Review & submit

3. **Navigation:**
   - Users see "Step X of Y" indicator
   - Progress bar shows completion percentage
   - Previous/Next buttons for navigation
   - Submit button only on last page
   - Can't skip pages - must complete in order

---

## 📋 Real-World Examples

### **Example 1: Site Survey Form**

```
Single-page with 3 sections:

Section 1: Location Details
- Site Name
- Address
- GPS Coordinates
- Site Type (dropdown)

Section 2: Site Conditions
- Access Type
- Terrain
- Vegetation
- Photos

Section 3: Assessment
- Risk Level
- Recommendations
- Follow-up Required
```

### **Example 2: Customer Onboarding (Multi-Page)**

```
Page 1: Personal Information
  Section: Contact Details
  - Full Name
  - Email
  - Phone
  
  Section: Address
  - Street Address
  - City, State, ZIP

Page 2: Business Information
  Section: Company Details
  - Company Name
  - Industry
  - Employee Count
  
  Section: Requirements
  - Service Type
  - Budget Range

Page 3: Documentation
  Section: Required Documents
  - Business License (file upload)
  - Tax ID (file upload)
  - Insurance Certificate (file upload)

Page 4: Review & Submit
  Section: Summary
  - Review all entered data
  - Accept terms and conditions
  - Submit
```

### **Example 3: Equipment Inspection**

```
Multi-page with conditional logic:

Page 1: Equipment Info
  - Equipment ID
  - Equipment Type
  - Location

Page 2: Visual Inspection
  - Overall Condition (dropdown)
  - Photos (file upload)
  - Notes
  
  [If condition = "Damaged"]
  - Damage Type
  - Severity
  - Repair Needed

Page 3: Functional Tests
  - Test 1 Result
  - Test 2 Result
  - Test 3 Result

Page 4: Recommendations
  - Pass/Fail Status (calculated)
  - Next Inspection Date
  - Action Items
```

---

## 🎨 UI/UX Features

### **Form Builder:**
- **Toggle Switch** - Enable/disable multi-page mode
- **Page Tabs** - Click tabs to edit different pages
- **Section Cards** - Each section has its own card
- **Page Counter** - Shows total pages with +/- controls
- **Visual Hierarchy** - Clear structure: Pages → Sections → Fields

### **Form Submission:**
- **Progress Bar** - Shows percentage complete
- **Step Counter** - "Step 2 of 5"
- **Section Headers** - Bold titles with descriptions
- **Navigation Buttons** - Previous/Next at bottom
- **Validation Feedback** - Errors shown before proceeding
- **Scroll to Top** - Auto-scroll when changing pages

---

## 🔧 Technical Details

### **Data Structure:**

**Form Schema with Sections:**
```json
{
  "sections": [
    {
      "id": "section_1",
      "title": "Personal Information",
      "description": "Tell us about yourself",
      "collapsible": true,
      "pageNumber": 1
    },
    {
      "id": "section_2",
      "title": "Contact Details",
      "pageNumber": 1
    }
  ],
  "fields": [
    {
      "name": "full_name",
      "label": "Full Name",
      "type": "text",
      "required": true,
      "sectionId": "section_1"
    },
    {
      "name": "email",
      "label": "Email",
      "type": "email",
      "required": true,
      "sectionId": "section_2"
    }
  ],
  "multiPage": true,
  "totalPages": 3
}
```

### **Page Validation:**
- Validates only fields on current page
- Required fields must be filled before proceeding
- Validation errors shown inline
- Toast notification if validation fails
- Can go back to previous pages without validation

### **State Management:**
- Current page tracked in React state
- Form data persists across pages
- Validation errors per field
- Visible fields calculated per page
- Smooth transitions between pages

---

## ⚡ Features That Work Across Pages

All existing features work seamlessly with sections and pages:

### **✅ Conditional Logic:**
- Fields can be conditional on any page
- Conditions work across pages (field on page 1 can hide field on page 3)
- Hidden fields on current page don't block navigation

### **✅ Calculated Fields:**
- Calculations work across pages
- Can reference fields from previous pages
- Auto-update when dependencies change

### **✅ File Uploads:**
- Upload files on any page
- Files persist as you navigate
- Uploaded files shown on review page

### **✅ Validation Rules:**
- All validation types supported
- Validated per page
- Errors must be fixed to proceed

---

## 💡 Best Practices

### **Section Organization:**
1. **Group Related Fields** - Put similar fields together
2. **Logical Flow** - Arrange sections in order user expects
3. **Clear Titles** - Use descriptive section names
4. **Short Descriptions** - Brief explanation of section purpose
5. **Reasonable Size** - 3-7 fields per section ideal

### **Multi-Page Design:**
1. **Natural Breaks** - Split at logical points
2. **Page Purpose** - Each page should have clear goal
3. **3-5 Pages Ideal** - Too many pages = abandonment
4. **Important First** - Critical info on first pages
5. **Review Page** - Consider final review page

### **User Experience:**
1. **Progress Feedback** - Always show progress indicator
2. **Allow Back Navigation** - Users should move backward freely
3. **Save State** - Consider auto-save between pages
4. **Mobile First** - Test on small screens
5. **Clear Labels** - Section titles help navigation

---

## 🚀 Coming Soon

### **Planned Enhancements:**
1. **Drag & Drop Reordering**
   - Drag sections to reorder
   - Drag fields between sections
   - Visual feedback during drag

2. **Collapsible Sections in Multi-Page**
   - Allow collapsing even in multi-page mode
   - Expand/collapse all button
   - Remember collapsed state

3. **Page Jump Navigation**
   - Click progress bar to jump to page
   - Page menu/sidebar
   - "Skip to end" for power users

4. **Conditional Pages**
   - Show/hide entire pages based on conditions
   - Dynamic page count
   - Smart progress bar

5. **Section Templates**
   - Pre-built section templates
   - Common field groups
   - One-click section creation

6. **Auto-Save Between Pages**
   - Save progress on page change
   - Resume incomplete forms
   - Draft mode

---

## ⚠️ Important Notes

### **Sections:**
- At least one section required
- Deleting section moves fields to first section
- Section titles must be unique (recommended)
- Collapsible only works in single-page mode

### **Multi-Page:**
- Minimum 1 page, maximum 20 pages (recommended)
- Each page needs at least one section
- Can't skip pages - sequential navigation only
- Location captured once at start, not per page
- Submit button only on last page

### **Data Handling:**
- All pages submit as one form response
- Incomplete multi-page forms not saved
- If user closes browser, data lost (use auto-save feature coming soon)
- File uploads persist across pages

---

## 🐛 Known Limitations

1. **No Drag & Drop Yet** - Manual reordering only
2. **No Page Skipping** - Must go through all pages
3. **No Draft Saving** - Multi-page forms must be completed
4. **No Collapsible in Multi-Page** - Sections always expanded
5. **No Section Nesting** - Flat structure only
6. **No Page-Level Conditions** - Can't hide entire pages yet

---

## 📊 Testing Checklist

When using sections and pages, test:

- ✅ Create sections in single-page form
- ✅ Add fields to specific sections
- ✅ Section headers display correctly
- ✅ Collapsible sections work
- ✅ Enable multi-page mode
- ✅ Navigate between pages
- ✅ Progress bar updates
- ✅ Page validation works
- ✅ Can't skip pages
- ✅ Conditional fields across pages work
- ✅ Calculated fields across pages work
- ✅ File uploads persist across pages
- ✅ Submit only available on last page
- ✅ Back button works correctly
- ✅ Mobile responsive

---

## 🎓 Tips & Tricks

### **For Single-Page Forms:**
```
Use sections to:
- Break up long forms visually
- Group by category (personal, business, technical)
- Make collapsible for optional sections
- Improve scannability
```

### **For Multi-Page Forms:**
```
Design flow:
Page 1: Quick wins - easy fields to build momentum
Page 2-3: Detailed information
Last Page: Confirmation and review
```

### **Combining with Conditional Logic:**
```
Example: Medical form

Page 1: Basic Info
  Section: Personal
  - Name, DOB, etc.

Page 2: Medical History
  Section: Conditions
  - Has Diabetes? (checkbox)
  
  [If yes] Section: Diabetes Details (conditional section)
  - Type, Medication, etc.
```

### **Using Calculated Fields Across Pages:**
```
Page 1: Order Details
  - Item Price
  - Quantity

Page 2: Shipping
  - Shipping Cost

Page 3: Summary
  - Subtotal (calculated: price * quantity)
  - Total (calculated: subtotal + shipping)
```

---

## 🔗 Integration with Other Features

### **Works With:**
- ✅ **Phase 1**: File uploads, validation
- ✅ **Phase 2**: Conditional logic, calculated fields
- ✅ **Future Phases**: Digital signatures, QR scanning

### **Enhances:**
- Form organization
- User experience
- Data collection efficiency
- Mobile usability
- Complex form handling

---

## 📚 Related Documentation

- [Phase 1: Validation & File Uploads](./FORM_ENHANCEMENTS.md)
- [Phase 2: Conditional Logic & Calculated Fields](./PHASE2_CONDITIONAL_CALCULATED.md)
- Phase 3: Digital Signatures & QR Scanning (Coming Soon)
- Phase 4: Repeating Sections (Coming Soon)
