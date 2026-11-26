/* ============================================================================
   NPPool REA — ขั้นที่ 1: สคริปต์สำรวจฐานข้อมูลเดิม (อ่านอย่างเดียว)
   ----------------------------------------------------------------------------
   เป้าหมาย : เติมช่องว่างใน docs/rea/01-inventory.md — จำนวนแถว, PK/FK/index,
              trigger/stored procedure, SQL Agent job และคุณภาพข้อมูลเบื้องต้น
   ใช้กับ   : SQL Server 2012 ขึ้นไป · ฐานข้อมูล TCRMIS · schema NPPOOL
   สถานะ    : รันแล้วกับ TCRMIS บนเครื่องผู้ใช้ 2026-11-26 (สรุปผลใน 01-inventory.md หัวข้อ 8.0)
   ความปลอดภัย:
     - มีแต่คำสั่ง SELECT — ไม่สร้าง แก้ หรือลบข้อมูลหรือ object ใดๆ
     - ผลลัพธ์ออกแบบให้เป็น metadata และตัวเลขสรุปของ schema NPPOOL เท่านั้น
       ไม่แสดงชื่อคน ชื่อบริษัท เบอร์โทร ที่อยู่ เลขบัตร ชื่อสถานที่ หรือ Username
     - ฐานข้อมูล TCRMIS ใช้ร่วมกับระบบอื่น — สคริปต์ไม่แสดงชื่อหรือขนาดของ schema อื่น
     - ส่วนที่ 5 แสดงนิยาม view / trigger / procedure ทั้งข้อความ — ตรวจด้วยตาก่อนส่งต่อ
       ว่าไม่มีรหัสผ่านหรือข้อมูลลูกค้าเขียนติดไว้ในโค้ด SQL
     - แต่ละส่วนเป็น batch แยกกัน (คั่นด้วย GO) — ถ้าส่วนใด error ส่วนอื่นยังทำงานต่อ
       และตารางที่อาจไม่มีในบางเวอร์ชัน (Location_From_To) ถูกตรวจก่อนอ่าน
   วิธีรัน (เลือกอย่างใดอย่างหนึ่ง):
     1) SSMS: เปิดไฟล์นี้ → เลือกฐานข้อมูล TCRMIS → Results to Text (Ctrl+T) → Execute (F5)
     2) sqlcmd (Windows authentication, ไฟล์เป็น UTF-8, ไม่ตัดข้อความยาวถึง 8000 ตัวอักษร):
        sqlcmd -S <server\instance> -d TCRMIS -E -f 65001 -y 8000 -s "|" -i 01-inventory-readonly.sql -o nppool-inventory-result.txt
        (ใช้ -W ร่วมกับ -y ไม่ได้ และ -y 0 จะไม่แสดงหัวคอลัมน์)
   หลังรัน : เปิดไฟล์ผลลัพธ์ตรวจอีกครั้ง แล้วส่งให้เซสชัน REA — ห้าม commit ผลดิบขึ้น repo ก่อนตรวจ
   ============================================================================ */
SET NOCOUNT ON;
-- อ่านโดยไม่ถือ shared lock เพื่อไม่รบกวนผู้ใช้งาน (ตัวเลขอาจคลาดเล็กน้อยถ้ามีการบันทึกระหว่างรัน)
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

PRINT '=== 1. Server, database and size of schema NPPOOL ===';
SELECT CAST(SERVERPROPERTY('ProductVersion') AS varchar(50)) AS product_version,
       CAST(SERVERPROPERTY('ProductLevel')   AS varchar(50)) AS product_level,
       CAST(SERVERPROPERTY('Edition')        AS varchar(100)) AS edition,
       DB_NAME()                                              AS database_name,
       CAST(DATABASEPROPERTYEX(DB_NAME(), 'Collation') AS varchar(100)) AS database_collation,
       (SELECT compatibility_level FROM sys.databases WHERE name = DB_NAME()) AS compatibility_level;

SELECT CAST(SUM(a.used_pages) * 8.0 / 1024 AS decimal(12, 2)) AS nppool_used_mb
FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id
JOIN sys.partitions p ON p.object_id = t.object_id
JOIN sys.allocation_units a ON a.container_id = p.partition_id
WHERE s.name = 'NPPOOL';
GO

PRINT '=== 2. Objects in schema NPPOOL (other schemas: count only) ===';
SELECT COUNT(DISTINCT s.name) AS other_schema_count
FROM sys.objects o
JOIN sys.schemas s ON s.schema_id = o.schema_id
WHERE o.is_ms_shipped = 0 AND s.name <> 'NPPOOL';

SELECT o.type_desc, o.name,
       CONVERT(varchar(10), o.create_date, 23) AS created,
       CONVERT(varchar(10), o.modify_date, 23) AS modified
FROM sys.objects o
JOIN sys.schemas s ON s.schema_id = o.schema_id
WHERE s.name = 'NPPOOL' AND o.is_ms_shipped = 0
ORDER BY o.type_desc, o.name;
GO

PRINT '=== 3. Row count per table (schema NPPOOL) ===';
SELECT t.name AS table_name, SUM(p.rows) AS row_count
FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id
JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0, 1)
WHERE s.name = 'NPPOOL'
GROUP BY t.name
ORDER BY t.name;
GO

PRINT '=== 4. Keys, constraints and indexes ===';
-- 4.1 Primary key / Unique constraint
SELECT t.name AS table_name, kc.type_desc AS constraint_type, kc.name AS constraint_name,
       ic.key_ordinal, c.name AS column_name
FROM sys.key_constraints kc
JOIN sys.tables t ON t.object_id = kc.parent_object_id
JOIN sys.schemas s ON s.schema_id = t.schema_id
JOIN sys.index_columns ic ON ic.object_id = kc.parent_object_id AND ic.index_id = kc.unique_index_id
JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
WHERE s.name = 'NPPOOL'
ORDER BY t.name, kc.name, ic.key_ordinal;

-- 4.2 Foreign key
SELECT fk.name AS fk_name,
       tp.name AS child_table, cp.name AS child_column,
       tr.name AS parent_table, cr.name AS parent_column,
       fk.delete_referential_action_desc AS on_delete,
       fk.update_referential_action_desc AS on_update,
       fk.is_disabled, fk.is_not_trusted
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
JOIN sys.tables tp ON tp.object_id = fkc.parent_object_id
JOIN sys.columns cp ON cp.object_id = fkc.parent_object_id AND cp.column_id = fkc.parent_column_id
JOIN sys.tables tr ON tr.object_id = fkc.referenced_object_id
JOIN sys.columns cr ON cr.object_id = fkc.referenced_object_id AND cr.column_id = fkc.referenced_column_id
JOIN sys.schemas s ON s.schema_id = tp.schema_id
WHERE s.name = 'NPPOOL'
ORDER BY tp.name, fk.name;

-- 4.3 Default / Check constraint
SELECT t.name AS table_name, c.name AS column_name, 'DEFAULT' AS kind, dc.definition
FROM sys.default_constraints dc
JOIN sys.tables t ON t.object_id = dc.parent_object_id
JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE s.name = 'NPPOOL'
UNION ALL
SELECT t.name, COL_NAME(cc.parent_object_id, cc.parent_column_id), 'CHECK', cc.definition
FROM sys.check_constraints cc
JOIN sys.tables t ON t.object_id = cc.parent_object_id
JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE s.name = 'NPPOOL'
ORDER BY 1, 2;

-- 4.4 Identity column (last_value ใช้ประเมินจำนวนรายการที่เคยสร้าง รวมที่ถูกลบไปแล้ว)
SELECT t.name AS table_name, ic.name AS column_name,
       CAST(ic.seed_value AS bigint) AS seed, CAST(ic.increment_value AS bigint) AS increment,
       CAST(ic.last_value AS bigint) AS last_value
FROM sys.identity_columns ic
JOIN sys.tables t ON t.object_id = ic.object_id
JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE s.name = 'NPPOOL'
ORDER BY t.name;

-- 4.5 Index
SELECT t.name AS table_name, i.name AS index_name, i.type_desc, i.is_unique, i.is_primary_key,
       ic.key_ordinal, c.name AS column_name, ic.is_included_column
FROM sys.indexes i
JOIN sys.tables t ON t.object_id = i.object_id
JOIN sys.schemas s ON s.schema_id = t.schema_id
JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
WHERE s.name = 'NPPOOL' AND i.type > 0
ORDER BY t.name, i.name, ic.key_ordinal;
GO

PRINT '=== 5. Definitions of views / triggers / procedures / functions (review before sharing) ===';
SELECT o.type_desc, o.name, m.definition
FROM sys.sql_modules m
JOIN sys.objects o ON o.object_id = m.object_id
JOIN sys.schemas s ON s.schema_id = o.schema_id
WHERE s.name = 'NPPOOL'
ORDER BY o.type_desc, o.name;
GO

PRINT '=== 6. SQL Agent jobs that run against this database (may be skipped) ===';
BEGIN TRY
    EXEC (N'SELECT j.name AS job_name, j.enabled, js.step_id, js.step_name, js.subsystem
            FROM msdb.dbo.sysjobs j
            JOIN msdb.dbo.sysjobsteps js ON js.job_id = j.job_id
            WHERE js.database_name = DB_NAME()
            ORDER BY j.name, js.step_id;');
END TRY
BEGIN CATCH
    SELECT 'skipped: ' + ERROR_MESSAGE() AS sql_agent_jobs;
END CATCH;
GO

PRINT '=== 7.1 Work orders: dates, empty fields, field usage ===';
SELECT COUNT(*) AS work_orders,
       MIN(w.CreatedDate) AS first_created, MAX(w.CreatedDate) AS last_created,
       MIN(w.JobReceiveDate) AS min_receive_date, MAX(w.JobReceiveDate) AS max_receive_date,
       MIN(w.JobDeliveryDate) AS min_delivery_date, MAX(w.JobDeliveryDate) AS max_delivery_date,
       SUM(CASE WHEN w.JobReceiveDate IS NULL THEN 1 ELSE 0 END) AS null_receive_date,
       SUM(CASE WHEN w.JobDeliveryDate < w.JobReceiveDate THEN 1 ELSE 0 END) AS delivery_before_receive,
       SUM(CASE WHEN w.TransportationCost IS NULL THEN 1 ELSE 0 END) AS null_transport_cost,
       SUM(CASE WHEN c.Id IS NULL THEN 1 ELSE 0 END) AS orphan_customer,
       SUM(CASE WHEN ISNULL(w.FeePort, 0) <> 0 THEN 1 ELSE 0 END) AS uses_fee_port,
       SUM(CASE WHEN ISNULL(w.FeeDemurrage, 0) <> 0 THEN 1 ELSE 0 END) AS uses_fee_demurrage,
       SUM(CASE WHEN ISNULL(w.FeeOvernight, 0) <> 0 THEN 1 ELSE 0 END) AS uses_overnight_nights,
       SUM(CASE WHEN w.FeeOvernight <> ROUND(w.FeeOvernight, 0) THEN 1 ELSE 0 END) AS overnight_not_integer,
       SUM(CASE WHEN ISNULL(w.FeeLabor, 0) <> 0 THEN 1 ELSE 0 END) AS uses_fee_labor,
       SUM(CASE WHEN ISNULL(w.Overhead, 0) <> 0 THEN 1 ELSE 0 END) AS uses_overhead_people,
       SUM(CASE WHEN ISNULL(w.OverheadCost, 0) <> 0 THEN 1 ELSE 0 END) AS uses_overhead_cost,
       SUM(CASE WHEN w.JobTime IS NOT NULL THEN 1 ELSE 0 END) AS uses_job_time,
       SUM(CASE WHEN ISNULL(w.Mileage, '') <> '' THEN 1 ELSE 0 END) AS uses_mileage,
       SUM(CASE WHEN ISNULL(w.JobShipmentNo, '') <> '' THEN 1 ELSE 0 END) AS uses_shipment_no,
       SUM(CASE WHEN ISNULL(w.PickerUser, '') <> '' THEN 1 ELSE 0 END) AS uses_pickup_contact,
       SUM(CASE WHEN ISNULL(w.DropoffUser, '') <> '' THEN 1 ELSE 0 END) AS uses_dropoff_contact,
       SUM(CASE WHEN COALESCE(w.PickupProvinceId, w.DropoffProvinceId, w.PickupDistrictId, w.DropoffDistrictId) IS NOT NULL THEN 1 ELSE 0 END) AS uses_address_ids,
       SUM(CASE WHEN w.ModifiedDate IS NOT NULL AND w.ModifiedDate <> w.CreatedDate THEN 1 ELSE 0 END) AS modified_after_create
FROM NPPOOL.WorkOrders w
LEFT JOIN NPPOOL.Customers c ON c.Id = w.CustomerId;

-- ใบงานแยกตามสถานะ
SELECT w.WorkStatusId, s.[Description] AS status_name, COUNT(*) AS work_orders
FROM NPPOOL.WorkOrders w
LEFT JOIN NPPOOL.WorkFlow_Status s ON s.Code = w.WorkStatusId
GROUP BY w.WorkStatusId, s.[Description]
ORDER BY w.WorkStatusId;

-- ค่าสถานะทั้งหมด (ข้อมูลอ้างอิง ไม่ใช่ข้อมูลลูกค้า)
SELECT Code, [Description] FROM NPPOOL.WorkFlow_Status ORDER BY Code;
GO

PRINT '=== 7.2 Work order numbers: per month (prefix NP+year+month), duplicates, format ===';
SELECT LEFT(WorkOrderNo, 8) AS prefix_np_year_month, COUNT(*) AS work_orders,
       MIN(WorkOrderNo) AS first_no, MAX(WorkOrderNo) AS last_no
FROM NPPOOL.WorkOrders
GROUP BY LEFT(WorkOrderNo, 8)
ORDER BY prefix_np_year_month;

SELECT COUNT(*) - COUNT(DISTINCT WorkOrderNo) AS duplicate_numbers,
       SUM(CASE WHEN WorkOrderNo NOT LIKE 'NP[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]' THEN 1 ELSE 0 END) AS non_standard_format
FROM NPPOOL.WorkOrders;
GO

PRINT '=== 7.3 Vehicle rows per work order, and quality of vehicle rows ===';
SELECT x.vehicle_rows, COUNT(*) AS work_orders
FROM (SELECT w.Id, COUNT(d.Id) AS vehicle_rows
      FROM NPPOOL.WorkOrders w
      LEFT JOIN NPPOOL.WorkOrderDetails d ON d.WorkOrderId = w.Id
      GROUP BY w.Id) x
GROUP BY x.vehicle_rows
ORDER BY x.vehicle_rows;

SELECT COUNT(*) AS detail_rows,
       SUM(CASE WHEN w.Id IS NULL THEN 1 ELSE 0 END) AS orphan_details,
       SUM(CASE WHEN d.DriverId IS NULL THEN 1 ELSE 0 END) AS no_driver,
       SUM(CASE WHEN d.VehicleId IS NULL THEN 1 ELSE 0 END) AS no_vehicle,
       SUM(CASE WHEN d.VehicleTypeId IS NULL THEN 1 ELSE 0 END) AS no_vehicle_type,
       SUM(CASE WHEN d.Quantity IS NOT NULL THEN 1 ELSE 0 END) AS with_quantity,
       SUM(CASE WHEN ISNULL(d.QuantityUnit, '') <> '' THEN 1 ELSE 0 END) AS with_quantity_unit,
       SUM(CASE WHEN d.[Weight] IS NOT NULL THEN 1 ELSE 0 END) AS with_weight,
       SUM(CASE WHEN ISNULL(d.WeightUnit, '') <> '' THEN 1 ELSE 0 END) AS with_weight_unit,
       SUM(CASE WHEN ISNULL(d.Dimensions, '') <> '' THEN 1 ELSE 0 END) AS with_dimensions
FROM NPPOOL.WorkOrderDetails d
LEFT JOIN NPPOOL.WorkOrders w ON w.Id = d.WorkOrderId;
GO

PRINT '=== 7.4 Users per role and password hash format (no usernames, no hashes) ===';
SELECT RoleType, COUNT(*) AS users,
       SUM(CASE WHEN PasswordHash LIKE 'AQAAAA%' THEN 1 ELSE 0 END) AS identity_v3_hash,
       SUM(CASE WHEN ISNULL(PasswordHash, '') = '' THEN 1 ELSE 0 END) AS no_password
FROM NPPOOL.Users
GROUP BY RoleType
ORDER BY RoleType;

SELECT COUNT(*) - COUNT(DISTINCT UPPER(Username)) AS duplicate_usernames_ignoring_case
FROM NPPOOL.Users;
GO

PRINT '=== 7.5 Master data: counts, filled fields, usage in work orders ===';
SELECT 'Customers' AS table_name, COUNT(*) AS row_count,
       SUM(CASE WHEN ISNULL(c.IDCard, '') = '' THEN 1 ELSE 0 END) AS missing_tax_id,
       SUM(CASE WHEN u.CustomerId IS NULL THEN 1 ELSE 0 END) AS never_used_in_work_orders,
       MIN(c.CreatedDT) AS first_created, MAX(c.CreatedDT) AS last_created
FROM NPPOOL.Customers c
LEFT JOIN (SELECT DISTINCT CustomerId FROM NPPOOL.WorkOrders) u ON u.CustomerId = c.Id;

SELECT 'Employee' AS table_name, COUNT(*) AS row_count,
       SUM(CASE WHEN ISNULL(e.EMP_ID, '') <> '' THEN 1 ELSE 0 END) AS with_emp_id,
       SUM(CASE WHEN ISNULL(e.IDCard, '') <> '' THEN 1 ELSE 0 END) AS with_id_card,
       SUM(CASE WHEN ISNULL(e.Address, '') <> '' THEN 1 ELSE 0 END) AS with_address,
       SUM(CASE WHEN ISNULL(e.Tel, '') <> '' THEN 1 ELSE 0 END) AS with_tel,
       SUM(CASE WHEN a.DriverId IS NULL THEN 1 ELSE 0 END) AS never_assigned_to_work_order,
       MIN(e.CreatedDT) AS first_created, MAX(e.CreatedDT) AS last_created
FROM NPPOOL.Employee e
LEFT JOIN (SELECT DISTINCT DriverId FROM NPPOOL.WorkOrderDetails WHERE DriverId IS NOT NULL) a ON a.DriverId = e.Id;

SELECT 'Vehicles' AS table_name, COUNT(*) AS row_count,
       SUM(CASE WHEN VehicleBrandId IS NOT NULL THEN 1 ELSE 0 END) AS with_brand,
       SUM(CASE WHEN VehicleTypeId IS NULL THEN 1 ELSE 0 END) AS without_type_id,
       SUM(CASE WHEN ISNULL([Name], '') <> '' THEN 1 ELSE 0 END) AS with_name_column,
       COUNT(*) - COUNT(DISTINCT LicensePlate) AS duplicate_or_empty_plates,
       MIN(CreatedDT) AS first_created, MAX(CreatedDT) AS last_created
FROM NPPOOL.Vehicles;

SELECT 'Lookup_PickDropLocation' AS table_name, COUNT(*) AS row_count
FROM NPPOOL.Lookup_PickDropLocation;

SELECT 'Master_DOPA' AS table_name, COUNT(*) AS row_count,
       COUNT(DISTINCT ProvinceID) AS provinces, COUNT(DISTINCT DistrictID) AS districts,
       COUNT(DISTINCT TambonID) AS tambons, COUNT(DISTINCT PostCodeMain) AS postcodes
FROM NPPOOL.Master_DOPA;

-- ตารางสถานที่รับ-ส่ง มีเฉพาะใน schema เวอร์ชันใหม่ — ตรวจก่อนอ่าน
IF OBJECT_ID(N'NPPOOL.Location_From_To', N'U') IS NOT NULL
    EXEC (N'SELECT ''Location_From_To'' AS table_name, COUNT(*) AS row_count,
                   COUNT(DISTINCT Location_From) AS distinct_from, COUNT(DISTINCT Location_To) AS distinct_to,
                   SUM(CASE WHEN Price IS NULL THEN 1 ELSE 0 END) AS without_price
            FROM NPPOOL.Location_From_To;');
ELSE
    SELECT 'Location_From_To' AS table_name, 'table not found in this database' AS note;
GO

PRINT '=== 7.6 Reference data: vehicle types and brands (not customer data) ===';
SELECT Id, VehicleType, VehicleName FROM NPPOOL.VehicleTypes ORDER BY Id;
SELECT Id, VehicleBrand FROM NPPOOL.VehicleBrand ORDER BY Id;
GO

PRINT '=== 8. Thai text encoding check (varchar + Thai_CI_AS) ===';
-- รูปแบบค้นหาอักษรไทย U+0E01 (ก) ถึง U+0E5B (๛) — สร้างจากรหัสอักขระ เพื่อไม่ขึ้นกับการเข้ารหัสของไฟล์นี้
DECLARE @thai nvarchar(10) = N'%[' + NCHAR(3585) + N'-' + NCHAR(3675) + N']%';
-- นับแถวที่มีอักษรไทย และแถวที่มีเครื่องหมาย ? (อาจเป็นอักขระที่แปลงเป็น code page 874 ไม่ได้แล้วหายไป)
SELECT 'Customers.Name' AS column_name,
       SUM(CASE WHEN CAST([Name] AS nvarchar(4000)) COLLATE Latin1_General_BIN2 LIKE @thai THEN 1 ELSE 0 END) AS rows_with_thai,
       SUM(CASE WHEN [Name] LIKE '%?%' THEN 1 ELSE 0 END) AS rows_with_question_mark,
       COUNT(*) AS total_rows
FROM NPPOOL.Customers
UNION ALL
SELECT 'Customers.Address',
       SUM(CASE WHEN CAST([Address] AS nvarchar(4000)) COLLATE Latin1_General_BIN2 LIKE @thai THEN 1 ELSE 0 END),
       SUM(CASE WHEN [Address] LIKE '%?%' THEN 1 ELSE 0 END), COUNT(*)
FROM NPPOOL.Customers
UNION ALL
SELECT 'Employee.FirstName',
       SUM(CASE WHEN CAST(FirstName AS nvarchar(4000)) COLLATE Latin1_General_BIN2 LIKE @thai THEN 1 ELSE 0 END),
       SUM(CASE WHEN FirstName LIKE '%?%' THEN 1 ELSE 0 END), COUNT(*)
FROM NPPOOL.Employee
UNION ALL
SELECT 'WorkOrders.PickupLocation',
       SUM(CASE WHEN CAST(PickupLocation AS nvarchar(4000)) COLLATE Latin1_General_BIN2 LIKE @thai THEN 1 ELSE 0 END),
       SUM(CASE WHEN PickupLocation LIKE '%?%' THEN 1 ELSE 0 END), COUNT(*)
FROM NPPOOL.WorkOrders
UNION ALL
SELECT 'WorkOrders.JobRemark',
       SUM(CASE WHEN CAST(JobRemark AS nvarchar(4000)) COLLATE Latin1_General_BIN2 LIKE @thai THEN 1 ELSE 0 END),
       SUM(CASE WHEN JobRemark LIKE '%?%' THEN 1 ELSE 0 END), COUNT(*)
FROM NPPOOL.WorkOrders
UNION ALL
SELECT 'VehicleTypes.VehicleName',
       SUM(CASE WHEN CAST(VehicleName AS nvarchar(4000)) COLLATE Latin1_General_BIN2 LIKE @thai THEN 1 ELSE 0 END),
       SUM(CASE WHEN VehicleName LIKE '%?%' THEN 1 ELSE 0 END), COUNT(*)
FROM NPPOOL.VehicleTypes
UNION ALL
SELECT 'VehicleBrand.VehicleBrand',
       SUM(CASE WHEN CAST(VehicleBrand AS nvarchar(4000)) COLLATE Latin1_General_BIN2 LIKE @thai THEN 1 ELSE 0 END),
       SUM(CASE WHEN VehicleBrand LIKE '%?%' THEN 1 ELSE 0 END), COUNT(*)
FROM NPPOOL.VehicleBrand
UNION ALL
SELECT 'Master_DOPA.TambonThai',
       SUM(CASE WHEN CAST(TambonThai AS nvarchar(4000)) COLLATE Latin1_General_BIN2 LIKE @thai THEN 1 ELSE 0 END),
       SUM(CASE WHEN TambonThai LIKE '%?%' THEN 1 ELSE 0 END), COUNT(*)
FROM NPPOOL.Master_DOPA;

IF OBJECT_ID(N'NPPOOL.Location_From_To', N'U') IS NOT NULL
    EXEC sp_executesql N'SELECT ''Location_From_To.Location_From'' AS column_name,
                                SUM(CASE WHEN CAST(Location_From AS nvarchar(4000)) COLLATE Latin1_General_BIN2 LIKE @p THEN 1 ELSE 0 END) AS rows_with_thai,
                                SUM(CASE WHEN Location_From LIKE ''%?%'' THEN 1 ELSE 0 END) AS rows_with_question_mark,
                                COUNT(*) AS total_rows
                         FROM NPPOOL.Location_From_To;', N'@p nvarchar(10)', @p = @thai;
GO

PRINT '=== End of script ===';
GO
