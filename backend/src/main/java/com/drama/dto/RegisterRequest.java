package com.drama.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 20, message = "用户名长度3-20")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "用户名只能包含字母、数字和下划线")
    private String username;
    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 50, message = "密码长度6-50")
    private String password;
    @NotBlank(message = "昵称不能为空")
    @Size(min = 1, max = 30, message = "昵称长度1-30")
    private String nickname;
}
