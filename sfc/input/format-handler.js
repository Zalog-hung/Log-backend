// 📁 format-handler.js
export class FormatHandler {
  constructor() {
    this.formatRules = new Map();
    this.validators = new Map();
    this.transformers = new Map();
    this.init();
  }

  init() {
    this.setupFormatRules();
    this.setupValidators();
    this.setupTransformers();
    if (window.ZaLogSystem) window.ZaLogSystem.formatHandler = this;
  }

  setupFormatRules() {
    this.formatRules.set('id', {
      pattern: /^\d{2}\.\d{2}\.\d{3}$/,
      template: 'DD.MM.XXX',
      autoGenerate: true
    });

    this.formatRules.set('date', {
      pattern: /^\d{1,2}\/\d{1,2}\/\d{4}$/,
      template: 'DD/MM/YYYY',
      autoFormat: true
    });

    this.formatRules.set('customer', {
      separator: '+',
      allowMultiple: true,
      trim: true
    });

    this.formatRules.set('quantity', {
      pattern: /^[\d\+\.T]+$/i,
      separator: '+',
      allowT: true,
      allowMultiple: true
    });

    this.formatRules.set('shift', {
      options: ['ngày', 'đêm'],
      autoComplete: true
    });

    this.formatRules.set('employee', {
      capitalize: true,
      trim: true
    });
  }

  setupValidators() {
    this.validators.set('id', this.validateId.bind(this));
    this.validators.set('date', this.validateDate.bind(this));
    this.validators.set('customer', this.validateCustomer.bind(this));
    this.validators.set('quantity', this.validateQuantity.bind(this));
    this.validators.set('shift', this.validateShift.bind(this));
    this.validators.set('employee', this.validateEmployee.bind(this));
  }

  setupTransformers() {
    this.transformers.set('id', this.transformId.bind(this));
    this.transformers.set('date', this.transformDate.bind(this));
    this.transformers.set('customer', this.transformCustomer.bind(this));
    this.transformers.set('quantity', this.transformQuantity.bind(this));
    this.transformers.set('shift', this.transformShift.bind(this));
    this.transformers.set('employee', this.transformEmployee.bind(this));
  }

  formatInput(value, type, options = {}) {
    if (!value && !options.allowEmpty) return '';
    
    const transformer = this.transformers.get(type);
    if (transformer) {
      return transformer(value, options);
    }
    
    return this.genericTransform(value, type, options);
  }

  validateInput(value, type, options = {}) {
    if (!value && !options.required) return { valid: true };
    
    const validator = this.validators.get(type);
    if (validator) {
      return validator(value, options);
    }
    
    return this.genericValidate(value, type, options);
  }

  // ID FORMATTING
  transformId(value, options = {}) {
    if (!value) return options.autoGenerate ? this.generateId() : '';
    
    const clean = value.replace(/[^\d\.]/g, '');
    const parts = clean.split('.');
    
    if (parts.length >= 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const counter = parts[2].padStart(3, '0');
      return `${day}.${month}.${counter}`;
    }
    
    return value;
  }

  validateId(value, options = {}) {
    if (!value) {
      return options.required ? 
        { valid: false, error: 'ID không được để trống' } :
        { valid: true };
    }

    const rule = this.formatRules.get('id');
    if (!rule.pattern.test(value)) {
      return { valid: false, error: 'Format ID: dd.mm.xxx' };
    }

    return { valid: true };
  }

  generateId() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const counter = this.getNextCounter(day, month);
    return `${day}.${month}.${counter}`;
  }

  getNextCounter(day, month) {
    const existingIds = this.getAllIds();
    const prefix = `${day}.${month}.`;
    const todayIds = existingIds.filter(id => id.startsWith(prefix));
    
    let maxCounter = 0;
    todayIds.forEach(id => {
      const parts = id.split('.');
      if (parts.length === 3) {
        const counter = parseInt(parts[2]);
        if (counter > maxCounter) maxCounter = counter;
      }
    });
    
    return String(maxCounter + 1).padStart(3, '0');
  }

  getAllIds() {
    const ids = [];
    document.querySelectorAll('input[data-type="id"]').forEach(input => {
      if (input.value) ids.push(input.value);
    });
    return ids;
  }

  // DATE FORMATTING
  transformDate(value, options = {}) {
    if (!value) return '';
    
    const clean = value.replace(/[^\d]/g, '');
    if (clean.length === 0) return '';
    
    let formatted = '';
    if (clean.length >= 2) {
      formatted = clean.substring(0, 2);
      if (clean.length >= 4) {
        formatted += '/' + clean.substring(2, 4);
        if (clean.length >= 8) {
          formatted += '/' + clean.substring(4, 8);
        }
      }
    } else {
      formatted = clean;
    }
    
    return formatted;
  }

  validateDate(value, options = {}) {
    if (!value) {
      return options.required ? 
        { valid: false, error: 'Ngày không được để trống' } :
        { valid: true };
    }

    const rule = this.formatRules.get('date');
    if (!rule.pattern.test(value)) {
      return { valid: false, error: 'Format ngày: dd/mm/yyyy' };
    }

    const parts = value.split('/');
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);

    if (day < 1 || day > 31) {
      return { valid: false, error: 'Ngày không hợp lệ (1-31)' };
    }
    if (month < 1 || month > 12) {
      return { valid: false, error: 'Tháng không hợp lệ (1-12)' };
    }
    if (year < 2020 || year > 2030) {
      return { valid: false, error: 'Năm không hợp lệ (2020-2030)' };
    }

    const date = new Date(year, month - 1, day);
    if (date.getDate() !== day || date.getMonth() !== month - 1) {
      return { valid: false, error: 'Ngày không tồn tại' };
    }

    return { valid: true };
  }

  // CUSTOMER FORMATTING
  transformCustomer(value, options = {}) {
    if (!value) return '';
    
    const rule = this.formatRules.get('customer');
    if (rule.allowMultiple && value.includes(rule.separator)) {
      return value.split(rule.separator)
        .map(s => rule.trim ? s.trim() : s)
        .filter(s => s.length > 0)
        .join(rule.separator);
    }
    
    return rule.trim ? value.trim() : value;
  }

  validateCustomer(value, options = {}) {
    if (!value) {
      return options.required ? 
        { valid: false, error: 'Khách hàng không được để trống' } :
        { valid: true };
    }

    const customers = this.parseCustomers(value);
    if (customers.length === 0) {
      return { valid: false, error: 'Danh sách khách hàng không hợp lệ' };
    }

    for (const customer of customers) {
      if (customer.length < 2) {
        return { valid: false, error: 'Tên khách hàng quá ngắn' };
      }
    }

    return { valid: true, data: customers };
  }

  parseCustomers(value) {
    const rule = this.formatRules.get('customer');
    if (!rule.allowMultiple || !value.includes(rule.separator)) {
      return [value.trim()];
    }
    
    return value.split(rule.separator)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  // QUANTITY FORMATTING
  transformQuantity(value, options = {}) {
    if (!value) return '';
    
    const clean = value.toUpperCase().replace(/[^0-9+.T]/g, '');
    return clean;
  }

  validateQuantity(value, options = {}) {
    if (!value) {
      return options.required ? 
        { valid: false, error: 'Số lượng không được để trống' } :
        { valid: true };
    }

    const rule = this.formatRules.get('quantity');
    if (!rule.pattern.test(value)) {
      return { valid: false, error: 'Format số lượng: 5 hoặc 5+3T' };
    }

    const quantities = this.parseQuantities(value);
    if (quantities.length === 0) {
      return { valid: false, error: 'Số lượng không hợp lệ' };
    }

    for (const qty of quantities) {
      if (qty.value <= 0) {
        return { valid: false, error: 'Số lượng phải > 0' };
      }
      if (qty.value > 100) {
        return { valid: false, error: 'Số lượng quá lớn (>100)' };
      }
    }

    return { valid: true, data: quantities };
  }

  parseQuantities(value) {
    const rule = this.formatRules.get('quantity');
    const parts = value.split(rule.separator);
    const quantities = [];
    
    parts.forEach(part => {
      const trimmed = part.trim();
      if (trimmed) {
        const isT = trimmed.toUpperCase().endsWith('T');
        const numValue = parseFloat(trimmed.replace(/T$/i, ''));
        
        if (!isNaN(numValue)) {
          quantities.push({
            value: numValue,
            isT: isT,
            original: trimmed
          });
        }
      }
    });
    
    return quantities;
  }

  // SHIFT FORMATTING
  transformShift(value, options = {}) {
    if (!value) return '';
    
    const lower = value.toLowerCase();
    const rule = this.formatRules.get('shift');
    
    if (rule.autoComplete) {
      if (lower.includes('ng') || lower.includes('day')) return 'ngày';
      if (lower.includes('đ') || lower.includes('night')) return 'đêm';
    }
    
    return value;
  }

  validateShift(value, options = {}) {
    if (!value) {
      return options.required ? 
        { valid: false, error: 'Ca làm việc không được để trống' } :
        { valid: true };
    }

    const rule = this.formatRules.get('shift');
    if (!rule.options.includes(value)) {
      return { valid: false, error: 'Ca làm việc: ngày hoặc đêm' };
    }

    return { valid: true };
  }

  // EMPLOYEE FORMATTING
  transformEmployee(value, options = {}) {
    if (!value) return '';
    
    const rule = this.formatRules.get('employee');
    let result = rule.trim ? value.trim() : value;
    
    if (rule.capitalize) {
      result = this.capitalizeVietnameseName(result);
    }
    
    return result;
  }

  validateEmployee(value, options = {}) {
    if (!value) {
      return options.required ? 
        { valid: false, error: 'Tên nhân viên không được để trống' } :
        { valid: true };
    }

    if (value.length < 3) {
      return { valid: false, error: 'Tên nhân viên quá ngắn' };
    }

    if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(value)) {
      return { valid: false, error: 'Tên chỉ chứa chữ cái và dấu cách' };
    }

    return { valid: true };
  }

  capitalizeVietnameseName(name) {
    return name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // GENERIC METHODS
  genericTransform(value, type, options) {
    if (!value) return '';
    
    let result = String(value);
    
    if (options.trim !== false) result = result.trim();
    if (options.uppercase) result = result.toUpperCase();
    if (options.lowercase) result = result.toLowerCase();
    
    return result;
  }

  genericValidate(value, type, options) {
    if (!value && options.required) {
      return { valid: false, error: 'Trường này không được để trống' };
    }
    
    if (options.minLength && value.length < options.minLength) {
      return { valid: false, error: `Tối thiểu ${options.minLength} ký tự` };
    }
    
    if (options.maxLength && value.length > options.maxLength) {
      return { valid: false, error: `Tối đa ${options.maxLength} ký tự` };
    }
    
    return { valid: true };
  }

  // UTILITY METHODS
  formatForDisplay(value, type) {
    if (!value) return '';
    
    switch (type) {
      case 'date':
        return this.formatDateDisplay(value);
      case 'quantity':
        return this.formatQuantityDisplay(value);
      default:
        return String(value);
    }
  }

  formatDateDisplay(value) {
    if (!value) return '';
    
    const parts = value.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${day}/${month}/${year}`;
    }
    
    return value;
  }

  formatQuantityDisplay(value) {
    if (!value) return '';
    
    const quantities = this.parseQuantities(value);
    return quantities.map(q => q.original).join(' + ');
  }

  parseFormData(formData) {
    const parsed = {};
    
    Object.entries(formData).forEach(([key, value]) => {
      const result = this.validateInput(value, key, { required: key !== 'id' });
      if (result.valid) {
        parsed[key] = {
          raw: value,
          formatted: this.formatInput(value, key),
          data: result.data
        };
      } else {
        parsed[key] = {
          raw: value,
          error: result.error
        };
      }
    });
    
    return parsed;
  }

  hasErrors(parsedData) {
    return Object.values(parsedData).some(field => field.error);
  }

  getErrors(parsedData) {
    const errors = {};
    Object.entries(parsedData).forEach(([key, field]) => {
      if (field.error) {
        errors[key] = field.error;
      }
    });
    return errors;
  }
}

export const formatHandler = new FormatHandler();

export default formatHandler;
