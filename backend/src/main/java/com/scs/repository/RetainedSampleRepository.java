package com.scs.repository;

import com.scs.entity.RetainedSample;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RetainedSampleRepository extends JpaRepository<RetainedSample, Long> {

    Optional<RetainedSample> findBySampleCode(String sampleCode);

    List<RetainedSample> findByVendor_Id(Long vendorId);
}
