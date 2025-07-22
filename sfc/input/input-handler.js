// 📁 input-handler.js - Excel input với autocomplete từ 3 sheets
// Version: 1.0 - Xử lý input Excel-like với autocomplete + validation

// ✅ IMPORT DEPENDENCIES
import { customerProcessor } from '../data/column-customer.js';
import { employeeProcessor } from '../data/column-employee.js';
import { vehicleProcessor } from '../data/column-vehicle.js';
import { chiaChuyenTheoQuyTac } from './chiachuyen.js';

// ✅ INPUT HANDLER CLASS
export class InputHandler {
  constructor() {
    this.activeCell = null;
    this.currentInput = null;
    this.autocompleteData = new Map();
    this.validationRules = new Map();
    this.isLoading = false;
    
    this.init();
  }

  // ✅ KHỞI TẠO SYSTEM
  init() {
    console.log('🎯 Initializing Input Handler...');
    
    this.setupEventListeners();
    this.setupValidationRules();
    this.preloadAutocompleteData();
    this.setupAutocompleteDropdown();
    
    // Register với global system
    if (window.ZaLogSystem) {
      window.ZaLogSystem.inputHandler = this;
    }
    
    console.log('✅ Input Handler initialized');
  }

  // ✅ SETUP EVENT LISTENERS
  setupEventListeners() {
    const gridElement = document.getElementById('gridElement');
    if (!gridElement) return;

    // Event delegation cho Excel cells
    gridElement.addEventListener('click', this.handleCellClick.bind(this));
    gridElement.addEventListener('focusin', this.handleCellFocus.bind(this));
    gridElement.addEventListener('focusout', this.handleCellBlur.bind(this));
    gridElement.addEventListener('input', this.handleCellInput.bind(this));
    gridElement.addEventListener('keydown', this.handleCellKeydown.bind(this));

    // Global keyboard shortcuts
    document.addEventListener('keydown', this.handleGlobalKeydown.bind(this));
    
    console.log('🎮 Event listeners attached to grid');
  }

  // ✅ SETUP VALIDATION RULES
  setupValidationRules() {
    this.validationRules.set('id', {
      format: /^\d{2}\.\d{2}\.\d{3}$/,
      required: false, // Auto-generated
      errorMsg: 'Format ID: dd.mm.xxx'
    });

    this.validationRules.set('date', {
      format: /^\d{1,2}\/\d{1,2}\/\d{4}$/,
      required: true,
      errorMsg: 'Format ngày: dd/mm/yyyy'
    });

    this.validationRules.set('customer', {
      required: true,
      source: 'customer',
      errorMsg: 'Vui lòng chọn khách hàng từ danh sách'
    });

    this.validationRules.set('quantity', {
      format: /^[\d\+\.T]+$/i,
      required: true,
      errorMsg: 'Format số lượng: 5 hoặc 5+3T'
    });

    this.validationRules.set('shift', {
      options: ['ngày', 'đêm'],
      required: true,
      errorMsg: 'Chọn ca: ngày hoặc đêm'
    });

    this.validationRules.set('employee', {
      required: true,
      source: 'employee',
      errorMsg: 'Vui lòng chọn tài xế từ danh sách'
    });

    console.log('📋 Validation rules configured');
  }

  // ✅ PRELOAD AUTOCOMPLETE DATA
  async preloadAutocompleteData() {
    try {
      console.log('📡 Preloading autocomplete data...');

      // Load customer data - Cột C "KHÁCH HÀNG" từ sheet "Khách Hàng"
      const customerData = await customerProcessor.getColumnData('KHÁCH HÀNG');
      this.autocompleteData.set('customer', customerData);
      console.log(`👥 Loaded ${customerData.length} customers`);

      // Load employee data - "Họ Tên" từ sheet "Nhân Viên"  
      const employeeData = await employeeProcessor.getColumnData('Họ Tên');
      this.autocompleteData.set('employee', employeeData);
      console.log(`👨‍💼 Loaded ${employeeData.length} employees`);

      // Load vehicle data - "SỐ XE" từ sheet "Phương Tiện"
      const vehicleData = await vehicleProcessor.getColumnData('SỐ XE');
      this.autocompleteData.set('vehicle', vehicleData);
      console.log(`🚛 Loaded ${vehicleData.length} vehicles`);

      // Update system status
      this.updateDataStatus();
      
    } catch (error) {
      console.error('❌ Error preloading autocomplete data:', error);
      this.showNotification('⚠️ Không thể tải dữ liệu autocomplete', 'error');
    }
  }

  // ✅ SETUP AUTOCOMPLETE DROPDOWN
  setupAutocompleteDropdown() {
    let dropdown = document.getElementById('autocompleteDropdown');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.id = 'autocompleteDropdown';
      dropdown.className = 'autocomplete-dropdown';
      dropdown.style.display = 'none';
      document.body.appendChild(dropdown);
    }

    // Event listeners for dropdown
    dropdown.addEventListener('click', this.handleDropdownClick.bind(this));
    dropdown.addEventListener('mouseover', this.handleDropdownHover.bind(this));
    
    this.dropdown = dropdown;
  }

  // ✅ HANDLE CELL CLICK
  handleCellClick(event) {
    const cell = event.target.closest('.excel-cell');
    const input = event.target.closest('input');
    
    if (cell && input) {
      this.activateCell(cell, input);
    }
  }

  // ✅ HANDLE CELL FOCUS
  handleCellFocus(event) {
    const input = event.target;
    const cell = input.closest('.excel-cell');
    
    if (cell && input) {
      this.activateCell(cell, input);
      
      // Show autocomplete if applicable
      const dataType = input.dataset.type;
      if (input.dataset.autocomplete && this.autocompleteData.has(dataType)) {
        this.showAutocomplete(input, dataType, input.value);
      }
    }
  }

  // ✅ HANDLE CELL BLUR
  handleCellBlur(event) {
    const input = event.target;
    
    // Validate on blur
    setTimeout(() => {
      this.validateInput(input);
      this.hideAutocomplete();
    }, 150); // Delay để cho phép click dropdown
  }

  // ✅ HANDLE CELL INPUT
  handleCellInput(event) {
    const input = event.target;
    const dataType = input.dataset.type;
    const value = input.value;

    // Show autocomplete for applicable fields
    if (input.dataset.autocomplete && this.autocompleteData.has(dataType)) {
      this.showAutocomplete(input, dataType, value);
    }

    // Special formatting
    this.formatInputValue(input, dataType, value);
    
    // Update form status
    this.updateFormStatus();
  }

  // ✅ HANDLE CELL KEYDOWN
  handleCellKeydown(event) {
    const input = event.target;
    const key = event.key;

    switch (key) {
      case 'Tab':
        event.preventDefault();
        this.moveToNextCell(input, !event.shiftKey);
        break;
        
      case 'Enter':
        if (this.dropdown && this.dropdown.style.display === 'block') {
          event.preventDefault();
          this.selectDropdownItem(0); // Select first item
        } else {
          event.preventDefault();
          this.moveToNextCell(input, true);
        }
        break;
        
      case 'ArrowDown':
        if (this.dropdown && this.dropdown.style.display === 'block') {
          event.preventDefault();
          this.navigateDropdown(1);
        }
        break;
        
      case 'ArrowUp':
        if (this.dropdown && this.dropdown.style.display === 'block') {
          event.preventDefault();
          this.navigateDropdown(-1);
        }
        break;
        
      case 'Escape':
        this.hideAutocomplete();
        input.blur();
        break;
    }
  }

  // ✅ HANDLE GLOBAL KEYDOWN
  handleGlobalKeydown(event) {
    // Global shortcuts
    if (event.ctrlKey) {
      switch (event.key) {
        case 's':
          event.preventDefault();
          this.saveLog();
          break;
        case 'n':
          event.preventDefault();
          this.addNewRow();
          break;
      }
    }
  }

  // ✅ ACTIVATE CELL
  activateCell(cell, input) {
    // Remove previous active state
    if (this.activeCell) {
      this.activeCell.classList.remove('active-cell');
    }
    
    // Set new active state
    this.activeCell = cell;
    this.currentInput = input;
    cell.classList.add('active-cell');
    
    // Auto-generate ID if needed
    if (input.dataset.type === 'id' && !input.value) {
      this.generateTripId(input);
    }
  }

  // ✅ GENERATE TRIP ID
  generateTripId(input) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Find next counter
    const existingIds = this.getAllTripIds();
    const todayPrefix = `${day}.${month}.`;
    const todayIds = existingIds.filter(id => id.startsWith(todayPrefix));
    
    let maxCounter = 0;
    todayIds.forEach(id => {
      const parts = id.split('.');
      if (parts.length === 3) {
        const counter = parseInt(parts[2]);
        if (counter > maxCounter) {
          maxCounter = counter;
        }
      }
    });
    
    const nextCounter = String(maxCounter + 1).padStart(3, '0');
    const tripId = `${day}.${month}.${nextCounter}`;
    
    input.value = tripId;
    console.log(`🆔 Generated trip ID: ${tripId}`);
  }

  // ✅ GET ALL TRIP IDS
  getAllTripIds() {
    const ids = [];
    const inputs = document.querySelectorAll('input[data-type="id"]');
    inputs.forEach(input => {
      if (input.value) {
        ids.push(input.value);
      }
    });
    return ids;
  }

  // ✅ SHOW AUTOCOMPLETE
  showAutocomplete(input, dataType, query) {
    const data = this.autocompleteData.get(dataType);
    if (!data || data.length === 0) return;

    // Filter data based on query
    const filteredData = this.filterAutocompleteData(data, query);
    if (filteredData.length === 0) {
      this.hideAutocomplete();
      return;
    }

    // Position dropdown
    const rect = input.getBoundingClientRect();
    this.dropdown.style.left = `${rect.left}px`;
    this.dropdown.style.top = `${rect.bottom + window.scrollY}px`;
    this.dropdown.style.width = `${Math.max(rect.width, 200)}px`;

    // Populate dropdown
    this.dropdown.innerHTML = '';
    filteredData.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'autocomplete-item';
      div.textContent = item;
      div.dataset.index = index;
      div.dataset.value = item;
      this.dropdown.appendChild(div);
    });

    // Show dropdown
    this.dropdown.style.display = 'block';
    this.selectedIndex = -1;
  }

  // ✅ FILTER AUTOCOMPLETE DATA
  filterAutocompleteData(data, query) {
    if (!query || query.length < 1) {
      return data.slice(0, 10); // Show first 10 items
    }

    const queryLower = this.removeDiacritics(query.toLowerCase());
    
    return data.filter(item => {
      const itemLower = this.removeDiacritics(item.toLowerCase());
      return itemLower.includes(queryLower);
    }).slice(0, 10); // Limit to 10 results
  }

  // ✅ REMOVE DIACRITICS (Vietnamese)
  removeDiacritics(str) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  // ✅ HIDE AUTOCOMPLETE
  hideAutocomplete() {
    if (this.dropdown) {
      this.dropdown.style.display = 'none';
      this.selectedIndex = -1;
    }
  }

  // ✅ HANDLE DROPDOWN CLICK
  handleDropdownClick(event) {
    const item = event.target.closest('.autocomplete-item');
    if (item) {
      const value = item.dataset.value;
      this.selectAutocompleteValue(value);
    }
  }

  // ✅ HANDLE DROPDOWN HOVER
  handleDropdownHover(event) {
    const item = event.target.closest('.autocomplete-item');
    if (item) {
      // Remove previous selection
      this.dropdown.querySelectorAll('.autocomplete-item').forEach(el => {
        el.classList.remove('selected');
      });
      
      // Add selection to hovered item
      item.classList.add('selected');
      this.selectedIndex = parseInt(item.dataset.index);
    }
  }

  // ✅ NAVIGATE DROPDOWN
  navigateDropdown(direction) {
    const items = this.dropdown.querySelectorAll('.autocomplete-item');
    if (items.length === 0) return;

    // Calculate new index
    let newIndex = this.selectedIndex + direction;
    if (newIndex < 0) newIndex = items.length - 1;
    if (newIndex >= items.length) newIndex = 0;

    // Update selection
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === newIndex);
    });

    this.selectedIndex = newIndex;
  }

  // ✅ SELECT DROPDOWN ITEM
  selectDropdownItem(index) {
    const items = this.dropdown.querySelectorAll('.autocomplete-item');
    if (items[index]) {
      const value = items[index].dataset.value;
      this.selectAutocompleteValue(value);
    }
  }

  // ✅ SELECT AUTOCOMPLETE VALUE
  selectAutocompleteValue(value) {
    if (this.currentInput) {
      this.currentInput.value = value;
      this.currentInput.focus();
      this.validateInput(this.currentInput);
    }
    this.hideAutocomplete();
  }

  // ✅ FORMAT INPUT VALUE
  formatInputValue(input, dataType, value) {
    switch (dataType) {
      case 'date':
        // Auto-format date as user types
        const cleanValue = value.replace(/\D/g, '');
        if (cleanValue.length >= 2) {
          let formatted = cleanValue.substring(0, 2);
          if (cleanValue.length >= 4) {
            formatted += '/' + cleanValue.substring(2, 4);
            if (cleanValue.length >= 8) {
              formatted += '/' + cleanValue.substring(4, 8);
            }
          }
          if (formatted !== value) {
            input.value = formatted;
          }
        }
        break;
        
      case 'shift':
        // Auto-complete shift
        const shiftLower = value.toLowerCase();
        if (shiftLower.includes('ng') && !shiftLower.includes('ngày')) {
          input.value = 'ngày';
        } else if (shiftLower.includes('đ') && !shiftLower.includes('đêm')) {
          input.value = 'đêm';
        }
        break;
    }
  }

  // ✅ VALIDATE INPUT
  validateInput(input) {
    const dataType = input.dataset.type;
    const value = input.value.trim();
    const rule = this.validationRules.get(dataType);
    
    if (!rule) return true;

    // Clear previous error state
    input.classList.remove('error');
    this.clearFieldError(input);

    // Check required
    if (rule.required && !value) {
      this.showFieldError(input, rule.errorMsg);
      return false;
    }

    // Check format
    if (rule.format && value && !rule.format.test(value)) {
      this.showFieldError(input, rule.errorMsg);
      return false;
    }

    // Check options
    if (rule.options && value && !rule.options.includes(value)) {
      this.showFieldError(input, rule.errorMsg);
      return false;
    }

    // Check source data
    if (rule.source && value) {
      const sourceData = this.autocompleteData.get(rule.source);
      if (sourceData && !sourceData.includes(value)) {
        this.showFieldError(input, rule.errorMsg);
        return false;
      }
    }

    return true;
  }

  // ✅ SHOW FIELD ERROR
  showFieldError(input, message) {
    input.classList.add('error');
    
    // Create or update error tooltip
    let tooltip = input.nextElementSibling;
    if (!tooltip || !tooltip.classList.contains('error-tooltip')) {
      tooltip = document.createElement('div');
      tooltip.className = 'error-tooltip';
      input.parentNode.insertBefore(tooltip, input.nextSibling);
    }
    
    tooltip.textContent = message;
    tooltip.style.display = 'block';
  }

  // ✅ CLEAR FIELD ERROR
  clearFieldError(input) {
    const tooltip = input.nextElementSibling;
    if (tooltip && tooltip.classList.contains('error-tooltip')) {
      tooltip.style.display = 'none';
    }
  }

  // ✅ MOVE TO NEXT CELL
  moveToNextCell(currentInput, forward = true) {
    const allInputs = Array.from(document.querySelectorAll('.excel-cell input'));
    const currentIndex = allInputs.indexOf(currentInput);
    
    if (currentIndex === -1) return;
    
    const nextIndex = forward ? currentIndex + 1 : currentIndex - 1;
    
    if (nextIndex >= 0 && nextIndex < allInputs.length) {
      const nextInput = allInputs[nextIndex];
      nextInput.focus();
      nextInput.select();
    }
  }

  // ✅ VALIDATE FORM
  validateForm() {
    const inputs = document.querySelectorAll('.excel-cell input');
    let isValid = true;
    let errors = [];

    inputs.forEach(input => {
      const rowData = this.getRowData(input);
      if (this.hasValidRowData(rowData)) {
        if (!this.validateInput(input)) {
          isValid = false;
          errors.push(`${this.getColumnName(input)}: ${input.value}`);
        }
      }
    });

    if (!isValid) {
      this.showNotification(`❌ Có ${errors.length} lỗi validation`, 'error');
      console.log('❌ Validation errors:', errors);
    }

    return isValid;
  }

  // ✅ GET ROW DATA
  getRowData(input) {
    const cell = input.closest('.excel-cell');
    if (!cell) return null;

    const cellData = cell.dataset.cell; // e.g., "0-2"
    if (!cellData) return null;

    const [row] = cellData.split('-');
    const rowInputs = document.querySelectorAll(`[data-cell^="${row}-"]`);
    
    const rowData = {};
    rowInputs.forEach(rowInput => {
      const colType = rowInput.dataset.type;
      if (colType) {
        rowData[colType] = rowInput.value.trim();
      }
    });

    return rowData;
  }

  // ✅ CHECK IF ROW HAS VALID DATA
  hasValidRowData(rowData) {
    if (!rowData) return false;
    
    // Row is considered valid if it has at least customer and quantity
    return rowData.customer && rowData.quantity;
  }

  // ✅ GET COLUMN NAME
  getColumnName(input) {
    const colType = input.dataset.type;
    const columnNames = {
      'id': 'ID Chuyến',
      'date': 'Ngày', 
      'customer': 'Khách Hàng',
      'quantity': 'Số Lượng',
      'shift': 'Ca',
      'employee': 'Tài Xế'
    };
    return columnNames[colType] || colType;
  }

  // ✅ UPDATE FORM STATUS
  updateFormStatus() {
    const totalRows = this.getTotalRows();
    const filledRows = this.getFilledRows();
    
    const totalRowsEl = document.getElementById('totalRows');
    const filledRowsEl = document.getElementById('filledRows');
    const formStatusEl = document.getElementById('formStatus');
    
    if (totalRowsEl) totalRowsEl.textContent = totalRows;
    if (filledRowsEl) filledRowsEl.textContent = filledRows;
    if (formStatusEl) {
      const status = filledRows > 0 ? 'Có dữ liệu' : 'Sẵn sàng';
      formStatusEl.textContent = status;
    }
  }

  // ✅ GET TOTAL ROWS
  getTotalRows() {
    const rows = new Set();
    document.querySelectorAll('.excel-cell input').forEach(input => {
      const cellData = input.closest('.excel-cell')?.dataset.cell;
      if (cellData) {
        const [row] = cellData.split('-');
        rows.add(row);
      }
    });
    return rows.size;
  }

  // ✅ GET FILLED ROWS
  getFilledRows() {
    const filledRows = new Set();
    document.querySelectorAll('.excel-cell input').forEach(input => {
      const cellData = input.closest('.excel-cell')?.dataset.cell;
      if (cellData && input.value.trim()) {
        const [row] = cellData.split('-');
        const rowData = this.getRowData(input);
        if (this.hasValidRowData(rowData)) {
          filledRows.add(row);
        }
      }
    });
    return filledRows.size;
  }

  // ✅ UPDATE DATA STATUS
  updateDataStatus() {
    const customerCount = this.autocompleteData.get('customer')?.length || 0;
    const employeeCount = this.autocompleteData.get('employee')?.length || 0;
    const vehicleCount = this.autocompleteData.get('vehicle')?.length || 0;
    
    const apisLoaded = (customerCount > 0 ? 1 : 0) + 
                     (employeeCount > 0 ? 1 : 0) + 
                     (vehicleCount > 0 ? 1 : 0);
    
    if (window.ZaLogSystem) {
      window.ZaLogSystem.state.apisLoaded = apisLoaded;
    }

    const dataStatus = document.getElementById('dataStatus');
    if (dataStatus) {
      dataStatus.textContent = `${apisLoaded}/3 Data Sources`;
    }
  }

  // ✅ SHOW NOTIFICATION
  showNotification(message, type = 'info') {
    if (window.showNotification) {
      window.showNotification(message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  // ✅ PUBLIC METHODS FOR INTEGRATION

  // Add new row
  addNewRow() {
    console.log('➕ Adding new row...');
    // This will be implemented in xulydon.js
    this.showNotification('🔄 Row management loading...', 'info');
  }

  // Save log
  saveLog() {
    console.log('💾 Saving log...');
    
    if (!this.validateForm()) {
      return;
    }

    // This will integrate with write-log.js
    this.showNotification('🔄 Save functionality loading...', 'info');
  }

  // Clear form
  clearForm() {
    console.log('🧹 Clearing form...');
    
    const inputs = document.querySelectorAll('.excel-cell input');
    inputs.forEach(input => {
      input.value = '';
      input.classList.remove('error');
      this.clearFieldError(input);
    });
    
    this.updateFormStatus();
    this.showNotification('✅ Form đã được xóa', 'success');
  }

  // Reload data
  async loadColumnData() {
    console.log('🔄 Reloading column data...');
    this.isLoading = true;
    
    try {
      await this.preloadAutocompleteData();
      this.showNotification('✅ Đã tải lại dữ liệu', 'success');
    } catch (error) {
      this.showNotification('❌ Lỗi tải dữ liệu', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  // Get form data for processing
  getFormData() {
    const formData = [];
    const processedRows = new Set();
    
    document.querySelectorAll('.excel-cell input').forEach(input => {
      const cellData = input.closest('.excel-cell')?.dataset.cell;
      if (!cellData) return;
      
      const [row] = cellData.split('-');
      if (processedRows.has(row)) return;
      
      const rowData = this.getRowData(input);
      if (this.hasValidRowData(rowData)) {
        formData.push({
          row: parseInt(row),
          ...rowData
        });
        processedRows.add(row);
      }
    });
    
    return formData;
  }
}

// ✅ EXPORT SINGLETON INSTANCE
export const inputHandler = new InputHandler();

// ✅ REGISTER GLOBAL FUNCTIONS
window.addNewRow = () => inputHandler.addNewRow();
window.saveLog = () => inputHandler.saveLog();
window.clearForm = () => inputHandler.clearForm();
window.loadColumnData = () => inputHandler.loadColumnData();

// ✅ EXPORT DEFAULT
export default inputHandler;
