// api/proxy/file/column.js - Get Column Data with Predefined Names
// Version: 1.0 - Individual endpoint for column extraction

// ✅ IMPORT CONFIG
import { API_URLS } from '../public/config.js';

// ✅ SERVER-SIDE CACHE STORAGE (shared)
let serverCache = new Map();
const CACHE_KEYS = {
  FULL_FILE_DATA: 'full_file_data',
  SHEET_LIST: 'sheet_list',
  LAST_MODIFIED: 'last_modified',
  DATA_HASH: 'data_hash'
};

// ✅ PREDEFINED COLUMN MAPPINGS (A=0, B=1, C=2, ...)
export const COLUMN_MAPPINGS = {
  COLUMN1: 0,   // Column A
  COLUMN2: 1,   // Column B
  COLUMN3: 2,   // Column C
  COLUMN4: 3,   // Column D
  COLUMN5: 4,   // Column E
  COLUMN6: 5,   // Column F
  COLUMN7: 6,   // Column G
  COLUMN8: 7,   // Column H
  COLUMN9: 8,   // Column I
  COLUMN10: 9,  // Column J
  COLUMN11: 10, // Column K
  COLUMN12: 11, // Column L
  COLUMN13: 12, // Column M
  COLUMN14: 13, // Column N
  COLUMN15: 14, // Column O
};

// ✅ REVERSE MAPPING (for display)
export const INDEX_TO_COLUMN = {
  0: 'COLUMN1',   // A
  1: 'COLUMN2',   // B
  2: 'COLUMN3',   // C
  3: 'COLUMN4',   // D
  4: 'COLUMN5',   // E
  5: 'COLUMN6',   // F
  6: 'COLUMN7',   // G
  7: 'COLUMN8',   // H
  8: 'COLUMN9',   // I
  9: 'COLUMN10',  // J
  10: 'COLUMN11', // K
  11: 'COLUMN12', // L
  12: 'COLUMN13', // M
  13: 'COLUMN14', // N
  14: 'COLUMN15', // O
};

// ✅ COLUMN LETTERS (for reference)
export const COLUMN_LETTERS = {
  0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E',
  5: 'F', 6: 'G', 7: 'H', 8: 'I', 9: 'J',
  10: 'K', 11: 'L', 12: 'M', 13: 'N', 14: 'O'
};

// ✅ UTILITY FUNCTION - Load Full File
async function loadFullFileIfNeeded() {
  const fullData = serverCache.get(CACHE_KEYS.FULL_FILE_DATA);
  
  if (!fullData) {
    console.log('🔄 Cache miss, need to load full file first');
    throw new Error('No cached data available. Please load full file first via /api/proxy/file/load');
  }
  
  return fullData;
}

// ✅ EXTRACT COLUMN DATA
function extractColumnData(sheetData, columnIndex) {
  try {
    if (!sheetData?.table?.rows) {
      return [];
    }
    
    const columnData = [];
    const maxRows = Math.min(sheetData.table.rows.length, 10000); // Prevent memory issues
    
    // Skip header row (index 0) - start from row 1
    for (let i = 1; i < maxRows; i++) {
      const row = sheetData.table.rows[i];
      
      if (row.c && row.c.length > columnIndex) {
        const cell = row.c[columnIndex];
        const value = cell?.v?.toString()?.trim();
        
        if (value && value.length > 0) {
          columnData.push(value);
        }
      }
    }
    
    // Remove duplicates and sort
    return [...new Set(columnData)].sort();
  } catch (error) {
    console.error('❌ Error extracting column data:', error);
    return [];
  }
}

export default async function handler(req, res) {
  const startTime = Date.now();

  // ✅ CORS SETUP
  const allowedOrigins = [
    'https://zalog.vercel.app',
    'https://zalog-fdzpsa7o5-hung-za.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'https://localhost',
    /^https:\/\/zalog-.+\.vercel\.app$/
  ];
  
  const origin = req.headers.origin;
  let isAllowedOrigin = false;
  
  if (allowedOrigins.includes(origin)) {
    isAllowedOrigin = true;
  } else {
    for (const pattern of allowedOrigins) {
      if (pattern instanceof RegExp && pattern.test(origin)) {
        isAllowedOrigin = true;
        break;
      }
    }
  }
  
  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Only GET and POST requests are supported'
    });
  }

  try {
    const { 
      columnName,        // 'COLUMN1', 'COLUMN2', etc.
      columnIndex,       // Numeric index (0, 1, 2, etc.)
      columnLetter,      // 'A', 'B', 'C', etc.
      sheetName = 'Khách Hàng',
      removeDuplicates = true,
      sortResults = true,
      includeEmpty = false
    } = req.method === 'POST' ? req.body : req.query;

    // ✅ DETERMINE COLUMN INDEX
    let colIndex;
    
    if (columnName && COLUMN_MAPPINGS[columnName.toUpperCase()]) {
      // Use predefined column name (COLUMN1, COLUMN2, etc.)
      colIndex = COLUMN_MAPPINGS[columnName.toUpperCase()];
      console.log(`📋 Using column name: ${columnName.toUpperCase()} → Index ${colIndex} (${COLUMN_LETTERS[colIndex]})`);
    } else if (columnLetter) {
      // Convert letter to index (A=0, B=1, etc.)
      const letter = columnLetter.toUpperCase();
      colIndex = letter.charCodeAt(0) - 65; // A=0, B=1, C=2...
      if (colIndex < 0 || colIndex > 14) {
        return res.status(400).json({
          success: false,
          error: 'Invalid column letter',
          message: 'Column letter must be A-O',
          availableColumns: Object.keys(COLUMN_LETTERS)
        });
      }
      console.log(`📋 Using column letter: ${letter} → Index ${colIndex}`);
    } else if (columnIndex !== undefined) {
      // Use numeric index directly
      colIndex = parseInt(columnIndex);
      if (isNaN(colIndex) || colIndex < 0 || colIndex > 14) {
        return res.status(400).json({
          success: false,
          error: 'Invalid column index',
          message: 'Column index must be 0-14',
          availableIndexes: Object.keys(INDEX_TO_COLUMN).map(Number)
        });
      }
      console.log(`📋 Using column index: ${colIndex} (${COLUMN_LETTERS[colIndex]})`);
    } else {
      // Default to COLUMN3 (index 2, column C) - commonly used for customer names
      colIndex = COLUMN_MAPPINGS.COLUMN3;
      console.log(`📋 Using default column: COLUMN3 → Index ${colIndex} (${COLUMN_LETTERS[colIndex]})`);
    }

    console.log(`📋 Extracting column ${colIndex} from sheet ${sheetName}`);

    // ✅ LOAD DATA
    const fullData = await loadFullFileIfNeeded();
    
    if (!fullData.sheets[sheetName]) {
      return res.status(404).json({
        success: false,
        error: 'Sheet not found',
        message: `Sheet "${sheetName}" not found in file`,
        availableSheets: Object.keys(fullData.sheets),
        duration: Date.now() - startTime
      });
    }

    // ✅ EXTRACT COLUMN DATA
    const sheetData = fullData.sheets[sheetName];
    let columnData = extractColumnData(sheetData, colIndex);

    // ✅ APPLY FILTERS
    if (!includeEmpty) {
      columnData = columnData.filter(value => value && value.length > 0);
    }

    if (removeDuplicates) {
      columnData = [...new Set(columnData)];
    }

    if (sortResults) {
      columnData = columnData.sort();
    }

    console.log(`✅ Extracted column ${colIndex}: ${columnData.length} items`);

    return res.status(200).json({
      success: true,
      data: columnData,
      meta: {
        columnIndex: colIndex,
        columnName: INDEX_TO_COLUMN[colIndex],
        columnLetter: COLUMN_LETTERS[colIndex],
        sheetName: sheetName,
        itemCount: columnData.length,
        totalRows: sheetData.table?.rows?.length || 0,
        filters: {
          removeDuplicates,
          sortResults,
          includeEmpty
        },
        availableColumns: COLUMN_MAPPINGS
      },
      duration: Date.now() - startTime
    });

  } catch (error) {
    console.error('❌ Column extraction error:', error);
    
    let errorMessage = error.message;
    let statusCode = 500;
    
    if (error.message.includes('No cached data available')) {
      statusCode = 400;
      errorMessage = 'No cached data available. Please load full file first.';
    }
    
    return res.status(statusCode).json({
      success: false,
      error: 'Column extraction failed',
      message: errorMessage,
      availableColumns: COLUMN_MAPPINGS,
      usage: {
        byName: 'columnName: "COLUMN1"',
        byIndex: 'columnIndex: 0',
        byLetter: 'columnLetter: "A"'
      },
      duration: Date.now() - startTime
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '500kb',
    },
  },
  maxDuration: 10,
};