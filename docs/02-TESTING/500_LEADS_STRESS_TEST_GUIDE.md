# 🚀 500 Leads Queue Management Stress Test

**Test File:** `tests/e2e/queue-500-leads-stress-test.spec.ts`  
**Runner Script:** `scripts/testing/run-500-leads-stress-test.cjs`  
**Status:** ✅ **Production Ready** - Comprehensive enterprise-scale testing

---

## 📋 **OVERVIEW**

This comprehensive E2E stress test validates the system's ability to handle **500 leads** with full queue management functionality. It tests the complete **UI → Database → UI** workflow under enterprise-scale load.

## 🎯 **WHAT IT TESTS**

### **📊 Performance Metrics**
- **Lead Creation:** 500 leads in batches of 50
- **Database Operations:** Concurrent queries, large result sets
- **UI Responsiveness:** Table rendering with 500+ rows
- **Queue Management:** Bulk operations, sorting, filtering
- **Search Performance:** Pattern matching across large datasets
- **System Stability:** Memory usage and response times

### **🔧 Core Functionality**
- ✅ **Database Operations:** Create, read, update, delete with large datasets
- ✅ **Queue Management:** Add to queue, process, sort, clear operations
- ✅ **UI Navigation:** Responsive page transitions with large data
- ✅ **Search & Filter:** High-performance search across 500+ records
- ✅ **Pagination:** Efficient data loading and pagination
- ✅ **Error Handling:** Graceful degradation under load

### **⚡ Edge Cases**
- ✅ **Rapid Additions:** Adding 100 queue entries in quick succession
- ✅ **Concurrent Operations:** Multiple database operations simultaneously
- ✅ **Large Batch Processing:** Updating hundreds of records at once
- ✅ **Analytics Performance:** Chart rendering with large datasets

---

## 🚀 **HOW TO RUN**

### **Method 1: Using Runner Script (Recommended)**
```bash
node scripts/testing/run-500-leads-stress-test.cjs
```

### **Method 2: Direct Playwright Command**
```bash
npx playwright test tests/e2e/queue-500-leads-stress-test.spec.ts --reporter=line --workers=1 --timeout=300000
```

### **Prerequisites**
1. ✅ **Application running:** `npm run dev` (on localhost:3000+)
2. ✅ **Test credentials:** `credentials/test-credentials.local` [[memory:3535657]]
3. ✅ **Database access:** Supabase connection working
4. ✅ **System resources:** Minimum 4GB RAM recommended

---

## 📊 **TEST PHASES**

### **Phase 1: Database Setup (0-30s)**
- Creates 500 test leads in database using batch operations
- Verifies database connectivity and schema
- Cleans up any existing test data

### **Phase 2: UI Navigation (30-60s)**
- Logs in using test credentials
- Navigates to Leads page
- Verifies UI can handle large dataset loading
- Tests pagination and search functionality

### **Phase 3: Queue Management (60-120s)**
- Adds 100 leads to processing queue
- Tests queue sorting and filtering
- Validates queue operations (start/stop/clear)
- Verifies database queue state

### **Phase 4: Performance Testing (120-180s)**
- Tests search with complex patterns
- Validates sort operations with large datasets
- Checks chart/analytics rendering
- Monitors system responsiveness

### **Phase 5: Edge Cases (180-240s)**
- Rapid queue additions (100 entries in seconds)
- Concurrent database operations
- Large batch processing simulation
- Analytics with large datasets

### **Phase 6: Cleanup (240-300s)**
- Removes all test data from database
- Verifies system state after stress test
- Generates performance report

---

## 📈 **EXPECTED RESULTS**

### **✅ Success Criteria**
- **All 500 leads created successfully**
- **UI remains responsive throughout**
- **Queue operations complete without errors**
- **Search returns results in < 2 seconds**
- **No memory leaks or crashes**
- **Database integrity maintained**

### **📊 Performance Benchmarks**
- **Lead Creation:** < 60 seconds for 500 leads
- **Page Load:** < 5 seconds with 500+ records
- **Search Response:** < 2 seconds
- **Queue Operations:** < 10 seconds for 100 entries
- **Memory Usage:** < 500MB peak usage

---

## 🔧 **CONFIGURATION**

### **Test Data Structure**
```typescript
{
  first_name: "TestLead1",
  last_name: "Surname1", 
  phone: "+12345670001",
  company: "Company1",
  source: "website" | "referral" | "social_media",
  status: "new" | "contacted" | "qualified" | "proposal_sent",
  priority: "high" | "medium" | "low",
  notes: "Test lead 1 for queue stress testing"
}
```

### **Queue Entry Structure**
```typescript
{
  lead_id: "uuid",
  status: "pending" | "processing" | "completed",
  priority: "urgent" | "high" | "medium" | "low", 
  scheduled_at: "ISO timestamp",
  metadata: { source: "stress_test", batch: "test_500" }
}
```

---

## 🔍 **TROUBLESHOOTING**

### **Common Issues**

#### **Error: test-credentials.local not found**
```bash
# Create credentials file
cp credentials/example-credentials.local credentials/test-credentials.local
# Edit with your test database credentials
```

#### **Error: Application not running**
```bash
# Start the application
npm run dev
# Verify it's running on localhost:3000+
```

#### **Error: Database connection failed**
- Verify Supabase credentials in `test-credentials.local`
- Check network connectivity
- Ensure database has required tables (`leads`, `lead_processing_queue`)

#### **Error: Out of memory**
- Close unnecessary applications
- Increase Node.js memory limit: `node --max-old-space-size=4096`
- Run test with fewer workers: `--workers=1`

### **Performance Issues**

#### **Slow UI Rendering**
- Check browser DevTools for performance bottlenecks
- Verify virtual scrolling/pagination is working
- Monitor React component re-renders

#### **Slow Database Operations**
- Check Supabase dashboard for query performance
- Verify database indexes are properly configured
- Monitor connection pool usage

---

## 📄 **REPORTS & LOGGING**

### **Test Results Location**
- **Results:** `test-results/500-leads-stress-test-[timestamp].log`
- **Screenshots:** `test-results/screenshots/` (on failures)
- **Videos:** `test-results/videos/` (if enabled)

### **Log Analysis**
```bash
# View latest test results
ls -la test-results/500-leads-stress-test-*.log | tail -1 | xargs cat

# Search for errors
grep -i "error\|fail" test-results/500-leads-stress-test-*.log

# Performance metrics
grep -i "performance\|memory\|time" test-results/500-leads-stress-test-*.log
```

---

## 🎯 **INTEGRATION WITH CI/CD**

### **GitHub Actions Example**
```yaml
- name: Run 500 Leads Stress Test
  run: |
    npm run dev &
    sleep 30
    node scripts/testing/run-500-leads-stress-test.cjs
  timeout-minutes: 10
```

### **Performance Monitoring**
- Integrate with monitoring tools (DataDog, New Relic)
- Set up alerts for performance degradation
- Track memory usage and response times

---

## 💡 **BEST PRACTICES**

### **Before Running Tests**
1. ✅ Ensure clean database state
2. ✅ Close unnecessary browser tabs
3. ✅ Monitor system resources
4. ✅ Backup important data (if testing on prod-like env)

### **After Running Tests**
1. ✅ Review performance reports
2. ✅ Verify complete cleanup
3. ✅ Document any issues found
4. ✅ Update benchmarks if needed

---

## 🏆 **SUCCESS METRICS**

This stress test validates that your system can handle:
- **Enterprise Scale:** 500+ leads with full functionality
- **Concurrent Users:** Multiple operations simultaneously  
- **Production Load:** Real-world usage patterns
- **Performance Standards:** Sub-second response times
- **Data Integrity:** No corruption under load
- **System Stability:** No crashes or memory leaks

**🎉 Passing this test means your system is ready for enterprise deployment!** 