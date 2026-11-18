package com.certificate.platform.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AddMentorCreditRequest {

    private Long mentorId;
    private String mentorUsername;
    private String roleTitle;
}
