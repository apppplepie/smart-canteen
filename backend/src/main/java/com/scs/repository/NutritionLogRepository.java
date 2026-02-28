package com.scs.repository;

import com.scs.entity.NutritionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NutritionLogRepository extends JpaRepository<NutritionLog, Long> {

    List<NutritionLog> findByUser_IdOrderByRecordedAtDesc(Long userId);
}
