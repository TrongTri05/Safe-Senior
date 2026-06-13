package vn.edu.fpt.safe_senior.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import vn.edu.fpt.safe_senior.entity.About;
import vn.edu.fpt.safe_senior.repository.AboutRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AboutService {
      AboutRepository aboutRepository;

    public List<About> getAllMembers() {
        return aboutRepository.findAllByOrderByDisplayOrderAsc();
    }
}
