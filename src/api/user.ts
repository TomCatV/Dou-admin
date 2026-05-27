import { http } from "@/utils/http";

export type UserResult = {
  success: boolean;
  data: {
    /** 头像 */
    avatar: string;
    /** 用户名 */
    username: string;
    /** 昵称 */
    nickname: string;
    /** 当前登录用户的角色 */
    roles: Array<string>;
    /** 按钮级别权限 */
    permissions: Array<string>;
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
    mustChangePassword?: boolean;
  };
};

export type RefreshTokenResult = {
  success: boolean;
  data: {
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

type DouAdminLoginResult = {
  code: number;
  message: string;
  data: {
    token: string;
      admin: {
        id: string;
        username: string;
        display_name: string;
        role: string;
        account_type?: string;
        status: string;
      scope_type?: string;
      permissions?: string[];
      must_change_password?: boolean;
    };
  };
};

/** 登录 */
export const getLogin = (data?: object) => {
  return http
    .request<DouAdminLoginResult>("post", "/auth/login", { data })
    .then(res => {
      const admin = res?.data?.admin;
      const token = res?.data?.token;
      const expires = new Date(Date.now() + 12 * 60 * 60 * 1000);
      return {
        success: res?.code === 0 && !!token,
        data: {
          avatar: "",
          username: admin?.username || "",
          nickname: admin?.display_name || admin?.username || "",
          roles:
            admin?.scope_type === "circle"
              ? [admin?.account_type || admin?.role || "tenant_owner"]
              : [admin?.account_type || admin?.role || "admin_l3"],
          permissions: admin?.permissions?.length
            ? admin.permissions
            : admin?.role === "super_admin"
              ? ["*:*:*"]
              : [],
          accessToken: token || "",
          refreshToken: token || "",
          expires,
          mustChangePassword: !!admin?.must_change_password
        }
      } satisfies UserResult;
    });
};

/** 刷新`token` */
export const refreshTokenApi = (data?: object) => {
  return http.request<RefreshTokenResult>("post", "/refresh-token", { data });
};
