// 📁 data-aggregator.js - Xử lý dữ liệu từ Proxy
// Version: 1.0 - Processing data từ proxy cho HTML display

// ✅ DATA PROCESSING ENGINE
export class DataAggregator {
  constructor() {
    this.cache = new Map();
    this.processors = new Map();
    this.initProcessors();
  }

  // ✅ KHỞI TẠO CÁC PROCESSOR
  initProcessors() {
    this.processors.set('string', this.processString.bind(this));
    this.processors.set('array', this.processArray.bind(this));
    this.processors.set('object', this.processObject.bind(this));
    this.processors.set('number', this.processNumber.bind(this));
    this.processors.set('date', this.processDate.bind(this));
  }

  // ✅ XỬ LÝ STRING
  processString(value, options = {}) {
    if (typeof value !== 'string') {
      value = String(value || '');
    }

    // Clean string
    let processed = value.trim();

    // Remove extra spaces
    if (options.removeExtraSpaces) {
      processed = processed.replace(/\s+/g, ' ');
    }

    // Capitalize
    if (options.capitalize) {
      processed = processed.charAt(0).toUpperCase() + processed.slice(1).toLowerCase();
    }

    // Validate required
    if (options.required && !processed) {
      throw new Error(`Required string field is empty`);
    }

    // Max length
    if (options.maxLength && processed.length > options.maxLength) {
      processed = processed.substring(0, options.maxLength);
    }

    return processed;
  }

  // ✅ XỬ LÝ ARRAY
  processArray(value, options = {}) {
    if (!Array.isArray(value)) {
      return [];
    }

    let processed = [...value];

    // Remove empty/null items
    if (options.removeEmpty) {
      processed = processed.filter(item => 
        item !== null && item !== undefined && item !== ''
      );
    }

    // Remove duplicates
    if (options.removeDuplicates) {
      processed = [...new Set(processed)];
    }

    // Sort array
    if (options.sort) {
      processed = processed.sort((a, b) => {
        if (typeof a === 'string' && typeof b === 'string') {
          return a.localeCompare(b);
        }
        return a - b;
      });
    }

    // Limit size
    if (options.maxItems && processed.length > options.maxItems) {
      processed = processed.slice(0, options.maxItems);
    }

    return processed;
  }

  // ✅ XỬ LÝ OBJECT
  processObject(value, options = {}) {
    if (!value || typeof value !== 'object') {
      return {};
    }

    const processed = {};

    // Process each field
    Object.keys(value).forEach(key => {
      const fieldValue = value[key];
      const fieldOptions = options.fields?.[key] || {};

      // Skip if field is excluded
      if (options.exclude?.includes(key)) {
        return;
      }

      // Rename field if mapping exists
      const outputKey = options.fieldMapping?.[key] || key;

      // Process based on type
      if (Array.isArray(fieldValue)) {
        processed[outputKey] = this.processArray(fieldValue, fieldOptions);
      } else if (typeof fieldValue === 'string') {
        processed[outputKey] = this.processString(fieldValue, fieldOptions);
      } else if (typeof fieldValue === 'number') {
        processed[outputKey] = this.processNumber(fieldValue, fieldOptions);
      } else {
        processed[outputKey] = fieldValue;
      }
    });

    return processed;
  }

  // ✅ XỬ LÝ NUMBER
  processNumber(value, options = {}) {
    let processed = parseFloat(value);

    if (isNaN(processed)) {
      if (options.defaultValue !== undefined) {
        processed = options.defaultValue;
      } else {
        processed = 0;
      }
    }

    // Round to decimal places
    if (options.decimals !== undefined) {
      processed = Number(processed.toFixed(options.decimals));
    }

    // Min/Max validation
    if (options.min !== undefined && processed < options.min) {
      processed = options.min;
    }
    if (options.max !== undefined && processed > options.max) {
      processed = options.max;
    }

    return processed;
  }

  // ✅ XỬ LÝ DATE
  processDate(value, options = {}) {
    let date;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      // Try to parse dd/mm/yyyy format
      const ddmmyyyy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (ddmmyyyy) {
        const [, day, month, year] = ddmmyyyy;
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(value);
      }
    } else {
      date = new Date();
    }

    if (isNaN(date.getTime())) {
      if (options.defaultValue) {
        date = new Date(options.defaultValue);
      } else {
        date = new Date();
      }
    }

    // Format output
    if (options.format === 'dd/mm/yyyy') {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }

    if (options.format === 'iso') {
      return date.toISOString();
    }

    return date;
  }

  // ✅ XỬ LÝ DỮ LIỆU TỪ PROXY
  async processProxyData(apiName, rawData, schema = {}) {
    try {
      console.log(`🔄 Processing data from ${apiName}...`);

      // Validate input
      if (!rawData || typeof rawData !== 'object') {
        throw new Error('Invalid raw data from proxy');
      }

      // Check if proxy response format
      if (rawData.success === false) {
        throw new Error(rawData.error || 'Proxy returned error');
      }

      // Extract actual data
      const data = rawData.data || rawData;

      // Process based on schema
      let processed;

      if (Array.isArray(data)) {
        // Process array of items
        processed = data.map(item => this.processDataItem(item, schema));
        
        // Apply array-level processing
        if (schema.arrayOptions) {
          processed = this.processArray(processed, schema.arrayOptions);
        }
      } else {
        // Process single item
        processed = this.processDataItem(data, schema);
      }

      // Cache processed data
      this.cache.set(`${apiName}_processed`, {
        data: processed,
        timestamp: Date.now(),
        schema: schema
      });

      console.log(`✅ Processed ${apiName} data successfully`);
      return processed;

    } catch (error) {
      console.error(`❌ Error processing ${apiName} data:`, error);
      
      // Return fallback data
      return this.getFallbackData(apiName);
    }
  }

  // ✅ XỬ LÝ TỪNG ITEM
  processDataItem(item, schema) {
    if (!schema || Object.keys(schema).length === 0) {
      // No schema, return as-is but cleaned
      return this.processObject(item, { removeEmpty: true });
    }

    const processed = {};

    Object.keys(schema).forEach(field => {
      const fieldSchema = schema[field];
      const value = item[field];

      if (fieldSchema.type) {
        const processor = this.processors.get(fieldSchema.type);
        if (processor) {
          processed[field] = processor(value, fieldSchema.options || {});
        } else {
          processed[field] = value;
        }
      } else {
        processed[field] = value;
      }
    });

    return processed;
  }

  // ✅ GỘPDATA TỪ NHIỀU NGUỒN
  async mergeMultipleSources(sources = []) {
    try {
      console.log('🔗 Merging multiple data sources...');

      const mergedData = {
        timestamp: new Date().toISOString(),
        sources: sources.map(s => s.name),
        data: {},
        summary: {}
      };

      for (const source of sources) {
        const { name, data, schema } = source;
        
        if (data) {
          const processed = await this.processProxyData(name, data, schema);
          mergedData.data[name] = processed;
          mergedData.summary[name] = {
            count: Array.isArray(processed) ? processed.length : 1,
            type: Array.isArray(processed) ? 'array' : 'object'
          };
        }
      }

      console.log('✅ Data merge completed');
      return mergedData;

    } catch (error) {
      console.error('❌ Error merging data sources:', error);
      return { error: error.message, sources: [] };
    }
  }

  // ✅ LẤY FALLBACK DATA
  getFallbackData(apiName) {
    const fallbacks = {
      'customer': [],
      'employee': [],
      'vehicle': [],
      'material': [],
      'location': [],
      'log': []
    };

    return fallbacks[apiName] || [];
  }

  // ✅ LẤY DỮ LIỆU ĐÃ CACHE
  getCachedData(apiName) {
    const cached = this.cache.get(`${apiName}_processed`);
    
    if (!cached) return null;

    // Check if cache is still valid (5 minutes)
    const isValid = (Date.now() - cached.timestamp) < 300000;
    
    return isValid ? cached.data : null;
  }

  // ✅ XÓA CACHE
  clearCache(apiName = null) {
    if (apiName) {
      this.cache.delete(`${apiName}_processed`);
    } else {
      this.cache.clear();
    }
  }
}

// ✅ EXPORT SINGLETON INSTANCE
export const dataAggregator = new DataAggregator();

// ✅ EXPORT UTILITY FUNCTIONS
export function processStringData(value, options) {
  return dataAggregator.processString(value, options);
}

export function processArrayData(value, options) {
  return dataAggregator.processArray(value, options);
}

export function processProxyResponse(apiName, rawData, schema) {
  return dataAggregator.processProxyData(apiName, rawData, schema);
}

export default dataAggregator;