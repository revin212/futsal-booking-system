package com.yourorg.futsal.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import java.util.Collections;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GoogleTokenVerifierService {
  private final GoogleIdTokenVerifier verifier;

  public GoogleTokenVerifierService(@Value("${app.google.clientId}") String clientId) {
    this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), JacksonFactory.getDefaultInstance())
        .setAudience(Collections.singletonList(clientId))
        .build();
  }

  public GoogleIdToken.Payload verify(String idToken) {
    try {
      GoogleIdToken token = verifier.verify(idToken);
      if (token == null) return null;
      return token.getPayload();
    } catch (Exception e) {
      return null;
    }
  }
}

