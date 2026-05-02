package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.auth.SecurityUtils;
import com.yourorg.futsal.domain.repo.AppUserRepository;
import com.yourorg.futsal.web.dto.AdminPasswordChangeRequest;
import com.yourorg.futsal.web.exception.ApiException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/profile")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProfileController {
  private final AppUserRepository userRepo;
  private final PasswordEncoder passwordEncoder;

  public AdminProfileController(AppUserRepository userRepo, PasswordEncoder passwordEncoder) {
    this.userRepo = userRepo;
    this.passwordEncoder = passwordEncoder;
  }

  @PatchMapping("/password")
  @Transactional
  public void changePassword(@Valid @RequestBody AdminPasswordChangeRequest req) {
    var user = userRepo.findById(SecurityUtils.currentUserId())
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "User tidak ditemukan."));
    String hash = user.getPasswordHash();
    if (hash == null || hash.isBlank() || !passwordEncoder.matches(req.oldPassword(), hash)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Password lama salah.");
    }
    user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
    userRepo.save(user);
  }
}
