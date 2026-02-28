package com.scs.repository;

import com.scs.entity.SensorLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface SensorLogRepository extends JpaRepository<SensorLog, Long> {

    List<SensorLog> findByMetricOrderByRecordedAtDesc(String metric, Pageable pageable);

    List<SensorLog> findByMetricAndRecordedAtBetween(String metric, LocalDateTime start, LocalDateTime end);
}
