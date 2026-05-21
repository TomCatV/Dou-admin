import { reactive } from "vue";
import type { FormRules } from "element-plus";

const loginRules = reactive<FormRules>({
  username: [
    {
      required: true,
      message: "请输入管理员账号",
      trigger: "blur"
    }
  ],
  password: [
    {
      required: true,
      message: "请输入管理员密码",
      trigger: "blur"
    },
    {
      min: 8,
      message: "密码至少 8 位",
      trigger: "blur"
    }
  ]
});

export { loginRules };
