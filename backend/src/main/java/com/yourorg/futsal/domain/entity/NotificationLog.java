package com.yourorg.futsal.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "notification_log")
public class NotificationLog {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "booking_id")
  private Long bookingId;

  @Column(nullable = false)
  private String channel = "WHATSAPP_MOCK";

  @Column(name = "template_key")
  private String templateKey;

  @Column(name = "notification_type", nullable = false)
  private String notificationType;

  @Column(name = "recipient_type", nullable = false)
  private String recipientType;

  @Column(name = "recipient_value")
  private String recipientValue;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String message;

  @Column(name = "delivery_status", nullable = false)
  private String deliveryStatus = "LOGGED";

  @Column(name = "error_message")
  private String errorMessage;

  @Column(name = "provider_response", columnDefinition = "TEXT")
  private String providerResponse;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  public Long getId() {
    return id;
  }

  public Long getBookingId() {
    return bookingId;
  }

  public void setBookingId(Long bookingId) {
    this.bookingId = bookingId;
  }

  public String getChannel() {
    return channel;
  }

  public void setChannel(String channel) {
    this.channel = channel;
  }

  public String getTemplateKey() {
    return templateKey;
  }

  public void setTemplateKey(String templateKey) {
    this.templateKey = templateKey;
  }

  public String getNotificationType() {
    return notificationType;
  }

  public void setNotificationType(String notificationType) {
    this.notificationType = notificationType;
  }

  public String getRecipientType() {
    return recipientType;
  }

  public void setRecipientType(String recipientType) {
    this.recipientType = recipientType;
  }

  public String getRecipientValue() {
    return recipientValue;
  }

  public void setRecipientValue(String recipientValue) {
    this.recipientValue = recipientValue;
  }

  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }

  public String getDeliveryStatus() {
    return deliveryStatus;
  }

  public void setDeliveryStatus(String deliveryStatus) {
    this.deliveryStatus = deliveryStatus;
  }

  public String getErrorMessage() {
    return errorMessage;
  }

  public void setErrorMessage(String errorMessage) {
    this.errorMessage = errorMessage;
  }

  public String getProviderResponse() {
    return providerResponse;
  }

  public void setProviderResponse(String providerResponse) {
    this.providerResponse = providerResponse;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}

