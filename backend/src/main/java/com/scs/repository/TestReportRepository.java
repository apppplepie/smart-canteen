package com.scs.repository;

import com.scs.entity.TestReport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TestReportRepository extends JpaRepository<TestReport, Long> {

    List<TestReport> findByVendor_IdOrderByTestedAtDesc(Long vendorId);
}
