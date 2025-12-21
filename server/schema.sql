-- Create Tables for Business OS

-- 1. EMPLOYEES
CREATE TABLE IF NOT EXISTS "employees" (
    "id" BIGINT PRIMARY KEY, -- Keep mapped to original ID
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "image" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "joiningDate" DATE,
    "salary" NUMERIC,
    "perShiftAmount" NUMERIC,
    "shiftStart" TIME DEFAULT '09:00',
    "shiftEnd" TIME DEFAULT '18:00',
    "status" TEXT DEFAULT 'Active',
    "lastWorkingDay" DATE,
    "bankDetails" JSONB,
    "documents" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. INVENTORY
CREATE TABLE IF NOT EXISTS "inventory" (
    "id" BIGINT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "type" TEXT,
    "quantity" INTEGER DEFAULT 0,
    "unit" TEXT,
    "price" NUMERIC DEFAULT 0,
    "minStockLevel" INTEGER DEFAULT 0,
    "location" TEXT,
    "image" TEXT,
    "vendor" TEXT,
    "lastUpdated" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. VENDORS
CREATE TABLE IF NOT EXISTS "vendors" (
    "id" BIGINT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "gstin" TEXT,
    "address" TEXT,
    "category" TEXT,
    "paymentTerms" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TIMESHEET ENTRIES
CREATE TABLE IF NOT EXISTS "timesheet_entries" (
    "unique_id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "employeeId" BIGINT REFERENCES "employees"("id") ON DELETE CASCADE,
    "date" DATE NOT NULL,
    "clockIn" TIME,
    "clockOut" TIME,
    "shiftStart" TIME,
    "shiftEnd" TIME,
    "breakMinutes" INTEGER DEFAULT 60,
    "dayType" TEXT DEFAULT 'Work',
    "status" TEXT DEFAULT 'active',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PAYROLL ENTRIES
-- ID matches "1732386600000-0.123" format or "preview"
CREATE TABLE IF NOT EXISTS "payroll_entries" (
    "id" TEXT PRIMARY KEY, 
    "employeeId" BIGINT REFERENCES "employees"("id") ON DELETE CASCADE,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "grossPay" NUMERIC DEFAULT 0,
    "deductions" NUMERIC DEFAULT 0,
    "advanceDeductions" NUMERIC DEFAULT 0,
    "loanDeductions" NUMERIC DEFAULT 0,
    "netPay" NUMERIC DEFAULT 0,
    "status" TEXT DEFAULT 'Unpaid',
    "paidAt" TIMESTAMP WITH TIME ZONE,
    "paymentDetails" JSONB,
    "frozenData" JSONB, -- Stores snapshot
    "perShiftAmount" NUMERIC,
    "hourlyRate" NUMERIC,
    "totalOvertimeMinutes" INTEGER,
    "overtimePay" NUMERIC,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. DEDUCTIONS
CREATE TABLE IF NOT EXISTS "deductions" (
    "id" TEXT PRIMARY KEY,
    "employeeId" BIGINT REFERENCES "employees"("id") ON DELETE CASCADE,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "type" TEXT NOT NULL, -- 'advance' or 'loan'
    "amount" NUMERIC NOT NULL,
    "description" TEXT,
    "status" TEXT DEFAULT 'active',
    "linkedAdvanceId" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. ADVANCE SALARIES
CREATE TABLE IF NOT EXISTS "advance_salaries" (
    "id" TEXT PRIMARY KEY,
    "employeeId" BIGINT REFERENCES "employees"("id") ON DELETE CASCADE,
    "amount" NUMERIC NOT NULL,
    "dateIssued" DATE NOT NULL,
    "reason" TEXT,
    "status" TEXT DEFAULT 'pending',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. BONUS WITHDRAWALS
CREATE TABLE IF NOT EXISTS "bonus_withdrawals" (
    "id" TEXT PRIMARY KEY,
    "employeeId" BIGINT REFERENCES "employees"("id") ON DELETE CASCADE,
    "amount" NUMERIC NOT NULL,
    "date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. SETTINGS
CREATE TABLE IF NOT EXISTS "settings" (
    "key" TEXT PRIMARY KEY,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ENABLE REALTIME (Optional but good for future)
alter publication supabase_realtime add table "inventory";
alter publication supabase_realtime add table "timesheet_entries";
alter publication supabase_realtime add table "payroll_entries";
