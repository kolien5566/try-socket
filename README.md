1.这个程序是用来测试EMS数据上传的,
包含“在线设备列表”，“读取秒级数据”和“请求历史数据（resume data）”的功能;
2.入口文件是/src/server/index.js;
3.启动了tcp server（通过modbustcp连接ems）,
和web server（express，用处仅是发送public中静态文件作为web前端）;
4.前端是vue spa;

5.使用npm install安装依赖，使用npm start启动项目;