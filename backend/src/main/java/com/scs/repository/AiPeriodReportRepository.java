package com.scs.repository;

import com.scs.entity.AiPeriodReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiPeriodReportRepository extends JpaRepository<AiPeriodReport, Long> {

    Page<AiPeriodReport> findByScopeTypeAndScopeIdOrderByGeneratedAtDesc(
            String scopeType, long scopeId, Pageable pageable);

    Page<AiPeriodReport> findByReportTypeAndScopeTypeAndScopeIdOrderByGeneratedAtDesc(
            String reportType, String scopeType, long scopeId, Pageable pageable);
}
