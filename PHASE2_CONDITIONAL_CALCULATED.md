# Phase 2: Conditional Logic & Calculated Fields

## ✅ Features Implemented

### 1. 🔀 Conditional Logic (Dynamic Form Behavior)

Control field visibility based on user responses, making forms smarter and more context-aware.

#### **Key Features:**
- **Show/Hide Fields Dynamically** - Fields appear only when conditions are met
- **Multiple Conditions** - Set multiple rules per field
- **AND/OR Logic** - Combine conditions with flexible logic
- **7 Operators** - Comprehensive comparison options
- **Real-time Evaluation** - Instant field visibility updates

#### **Supported Operators:**
1. **Equals** - Field value matches exactly
2. **Not Equals** - Field value doesn't match
3. **Contains** - Field value contains text (case-insensitive)
4. **Greater Than** - Numeric comparison (>)
5. **Less Than** - Numeric comparison (<)
6. **Is Empty** - Field has no value
7. **Is Not Empty** - Field has a value

#### **How It Works:**
```
Example: Show "Other Reason" field only when "Status" = "Other"

Condition Setup:
- Field to Watch: status
- Operator: equals
- Value: Other

Result: "Other Reason" field only appears when user selects "Other"
```

#### **Complex Conditions:**
```
Show "Follow-up Date" when:
(Priority = "High" OR Urgency = "Critical") AND Status != "Closed"

Setup:
- Condition Logic: AND
- Condition 1: priority equals High
- Condition 2: urgency equals Critical
- Logic between 1&2: OR (in multi-condition scenario)
- Condition 3: status notEquals Closed
```

---

### 2. 🧮 Calculated Fields (Auto-Computation)

Automatically compute values based on other fields using formulas.

#### **Key Features:**
- **Formula-Based Calculations** - Use mathematical expressions
- **Field References** - Reference any numeric field
- **Auto-Update** - Recalculates when source fields change
- **Read-Only** - Prevents manual editing
- **Decimal Control** - Configure precision (0-10 decimals)

#### **Supported Operations:**
- Addition: `{price} + {tax}`
- Subtraction: `{total} - {discount}`
- Multiplication: `{quantity} * {price}`
- Division: `{total} / {quantity}`
- Complex: `({price} * {quantity}) * 1.1`

#### **Formula Syntax:**
```
Use curly braces to reference fields: {field_name}
Example formulas:

1. Simple Addition:
   {field1} + {field2}

2. Sales Tax:
   {subtotal} * 1.0825

3. Total with Tax:
   {price} * {quantity} * 1.1

4. Discount Calculation:
   {original_price} - ({original_price} * {discount_percent} / 100)

5. Average:
   ({score1} + {score2} + {score3}) / 3
```

#### **How It Works:**
```
Scenario: Calculate order total

Fields:
1. Price (number) - User enters $100
2. Quantity (number) - User enters 5
3. Tax Rate (number) - User enters 8.5
4. Total (calculated) - Formula: {price} * {quantity} * (1 + {tax_rate}/100)

Result: Total automatically shows $542.50
```

---

## 📋 Usage Guide

### **Creating Conditional Fields:**

1. **In Form Builder:**
   - Click on any field card
   - Expand "Conditional Visibility" section
   - Click "Add Condition"
   - Select the field to watch
   - Choose an operator
   - Enter the comparison value
   - Add more conditions if needed
   - Select AND/OR logic for multiple conditions

2. **Tips:**
   - Fields without conditions are always visible
   - Use "Is Empty" / "Is Not Empty" for checking if user filled a field
   - Combine multiple conditions for complex logic
   - Test your conditions by previewing the form

### **Creating Calculated Fields:**

1. **In Form Builder:**
   - Create a Number or Text field
   - Expand "Calculated Field" section
   - Toggle "Make this a calculated field"
   - Enter your formula using {field_name} syntax
   - Set decimal places (for numbers)
   - Field becomes read-only automatically

2. **Tips:**
   - Only number fields can be used in calculations
   - Use parentheses for order of operations
   - Preview shows available fields for reference
   - Calculations update in real-time as users fill the form

---

## 🎯 Real-World Examples

### **Example 1: Customer Feedback Form**

```
Field: rating (select: Excellent, Good, Fair, Poor)
Field: feedback_reason (textarea)
  Condition: rating notEquals Excellent
  Result: Only shown if rating is not Excellent

Field: followup_needed (checkbox)
  Condition: rating equals Poor
  Result: Only shown for poor ratings
```

### **Example 2: Invoice Form**

```
Field: item_price (number)
Field: quantity (number)
Field: subtotal (calculated)
  Formula: {item_price} * {quantity}
  
Field: tax_rate (number) - User enters 8.5 for 8.5%
Field: tax_amount (calculated)
  Formula: {subtotal} * ({tax_rate} / 100)
  Decimals: 2
  
Field: total (calculated)
  Formula: {subtotal} + {tax_amount}
  Decimals: 2
```

### **Example 3: Site Survey Form**

```
Field: site_type (select: Residential, Commercial, Industrial)

Field: residential_details (textarea)
  Condition: site_type equals Residential
  
Field: commercial_details (textarea)
  Condition: site_type equals Commercial
  
Field: area_sqft (number)
Field: cost_per_sqft (number)
Field: estimated_cost (calculated)
  Formula: {area_sqft} * {cost_per_sqft}
  Decimals: 2
```

### **Example 4: Event Registration**

```
Field: attendees (number)
Field: needs_catering (checkbox)

Field: catering_options (select)
  Conditions:
    - needs_catering equals true AND
    - attendees greaterThan 10
  Result: Only shown when catering needed and 10+ attendees

Field: ticket_price (number) - Set to 50
Field: total_cost (calculated)
  Formula: {attendees} * {ticket_price}
```

---

## 🔧 Technical Details

### **Conditional Logic Evaluation:**
- Evaluated in real-time as user fills form
- Re-evaluated on every field change
- Hidden fields are excluded from form submission
- Required validation only applies to visible fields
- Supports nested dependencies (field A → field B → field C)

### **Calculation Engine:**
- Uses safe JavaScript eval for formula execution
- Only allows numbers, operators, and parentheses
- Invalid formulas return null
- Missing field values treated as 0
- Updates automatically when dependencies change
- Calculation order respects field dependencies

### **Performance:**
- Efficient React hooks for real-time updates
- Minimal re-renders using useEffect dependencies
- Memoized condition evaluation
- No server calls needed (client-side only)

### **Data Storage:**
Form schema stores configurations:

```json
{
  "name": "show_if_other",
  "label": "Other Reason",
  "type": "textarea",
  "conditions": [
    {
      "field": "reason",
      "operator": "equals",
      "value": "Other"
    }
  ],
  "conditionLogic": "AND"
}
```

```json
{
  "name": "total_price",
  "label": "Total",
  "type": "number",
  "readonly": true,
  "calculation": {
    "formula": "{price} * {quantity}",
    "decimals": 2
  }
}
```

---

## ⚠️ Important Notes

### **Conditional Logic:**
- Hidden fields don't block form submission
- Hidden required fields are temporarily optional
- Circular dependencies are not prevented (avoid creating them)
- Conditions evaluate top-to-bottom in field order
- File upload fields can have conditions

### **Calculated Fields:**
- Automatically marked as read-only
- Can only reference number fields
- Division by zero returns null
- Invalid formulas fail silently (show null)
- Not validated for circular references
- Can be used as inputs for other calculations

### **Limitations:**
1. No date/time calculations yet
2. No string manipulation in formulas
3. No conditional calculations (if/then/else)
4. No aggregate functions (sum, average, etc.)
5. Calculated fields can't be conditional trigger fields

---

## 🚀 Future Enhancements

### **Possible Additions:**
1. **Advanced Operators:**
   - Starts With / Ends With
   - Between (range)
   - In List / Not In List

2. **Calculation Functions:**
   - MIN({field1}, {field2})
   - MAX({field1}, {field2})
   - ROUND({field}, decimals)
   - IF({condition}, {true_value}, {false_value})

3. **Date Calculations:**
   - Age from birthdate
   - Days between dates
   - Add/subtract days

4. **String Calculations:**
   - CONCAT({field1}, " ", {field2})
   - UPPER({field})
   - SUBSTRING({field}, start, length)

5. **Visual Formula Builder:**
   - Drag-and-drop formula creation
   - Visual field picker
   - Formula validation preview

---

## 🐛 Known Issues

1. **Circular References:** Not detected - avoid creating field A → field B → field A
2. **Hidden Required Fields:** May show validation errors if conditions change mid-form
3. **Performance:** Complex nested conditions with many fields may cause lag
4. **Error Messages:** Calculation errors fail silently
5. **Offline Mode:** Calculations work offline, but complex formulas may fail

---

## 📊 Testing Checklist

When using these features, test:

- ✅ Single condition shows/hides field correctly
- ✅ Multiple AND conditions work together
- ✅ Multiple OR conditions work together
- ✅ Hidden fields don't block submission
- ✅ Calculated fields update in real-time
- ✅ Complex formulas compute correctly
- ✅ Division by zero handled gracefully
- ✅ Decimal places display correctly
- ✅ Conditions with select fields work
- ✅ Conditions with checkboxes work
- ✅ File fields with conditions work
- ✅ Validation respects visibility

---

## 🎓 Best Practices

1. **Keep It Simple:**
   - Start with single conditions before adding complexity
   - Test each condition independently
   - Document complex logic in field labels

2. **User Experience:**
   - Don't hide required fields that user needs to see
   - Provide clear labels for conditional fields
   - Test the user flow thoroughly

3. **Calculations:**
   - Always test with edge cases (0, negative, very large numbers)
   - Set appropriate decimal places
   - Use descriptive field names for clarity

4. **Performance:**
   - Limit conditions per field (max 3-5 recommended)
   - Avoid deep nesting of conditional fields
   - Use simple formulas when possible

5. **Maintenance:**
   - Document conditional logic in form description
   - Use consistent field naming
   - Test after any field changes

---

## 💡 Pro Tips

1. **Conditional Required Fields:**
   - Mark field as required
   - Add condition to show/hide
   - Field is only required when visible!

2. **Cascading Dropdowns:**
   - Use conditions to show different dropdowns
   - Based on previous selection
   - Creates dynamic multi-level forms

3. **Smart Defaults:**
   - Use calculations for common values
   - Pre-fill related fields
   - Reduce data entry time

4. **Progressive Disclosure:**
   - Start with basic fields
   - Show advanced options conditionally
   - Keep forms clean and focused

5. **Validation + Conditions:**
   - Combine both for powerful forms
   - Example: Show max length only when field visible
   - Reduce user confusion

---

## 🔗 Related Documentation

- [Phase 1: Validation & File Uploads](./FORM_ENHANCEMENTS.md)
- Phase 3: Digital Signatures & QR Scanning (Coming Soon)
- Phase 4: Repeating Sections (Coming Soon)
