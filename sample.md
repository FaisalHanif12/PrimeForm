<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>PrimeForm Login</title>
  <style>
    body {
      margin: 0;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: Arial, sans-serif;
      background: linear-gradient(135deg, #d4af37 0%, #0d1b2a 100%);
      overflow: hidden;
      color: #fff;
    }

    /* Background glowing particles */
    .particles {
      position: absolute;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: 0;
    }
    .particles span {
      position: absolute;
      display: block;
      width: 4px;
      height: 4px;
      background: rgba(212,175,55,0.8);
      border-radius: 50%;
      animation: float 8s linear infinite;
    }
    @keyframes float {
      0% { transform: translateY(100vh) scale(0); opacity: 0; }
      50% { opacity: 1; }
      100% { transform: translateY(-10vh) scale(1); opacity: 0; }
    }

    /* Glass card */
    .login-card {
      position: relative;
      z-index: 1;
      width: 350px;
      padding: 40px 30px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      text-align: center;
      animation: fadeIn 1s ease forwards;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .logo {
      font-size: 28px;
      font-weight: bold;
      background: linear-gradient(90deg, #d4af37, #0d6efd);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 20px;
    }

    .input-box {
      margin-bottom: 15px;
      position: relative;
    }
    .input-box input {
      width: 100%;
      padding: 12px 15px;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 8px;
      background: transparent;
      color: #fff;
      font-size: 14px;
      outline: none;
      transition: border 0.3s;
    }
    .input-box input:focus {
      border: 1px solid #d4af37;
      box-shadow: 0 0 8px rgba(212,175,55,0.4);
    }
    .input-box .toggle {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      font-size: 12px;
      color: #d4af37;
    }

    .btn {
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      background: linear-gradient(90deg, #d4af37, #0d6efd);
      color: #000;
      font-size: 15px;
      transition: all 0.3s;
    }
    .btn:hover {
      filter: brightness(1.1);
      box-shadow: 0 0 12px rgba(212,175,55,0.5);
    }

    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 20px 0;
      color: rgba(255,255,255,0.6);
      font-size: 12px;
    }
    .divider::before, .divider::after {
      content: "";
      flex: 1;
      border-bottom: 1px solid rgba(255,255,255,0.3);
    }
    .divider:not(:empty)::before {
      margin-right: .75em;
    }
    .divider:not(:empty)::after {
      margin-left: .75em;
    }

    .social-login {
      display: flex;
      justify-content: center;
      gap: 15px;
    }
    .social-login button {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      background: rgba(255,255,255,0.2);
      color: #fff;
      font-size: 18px;
      transition: all 0.3s;
    }
    .social-login button:hover {
      background: rgba(212,175,55,0.6);
    }

    .links {
      margin-top: 15px;
      font-size: 13px;
    }
    .links a {
      color: #d4af37;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="particles">
    <!-- Floating particles -->
    <span style="left:10%; animation-duration:7s; animation-delay:0s;"></span>
    <span style="left:30%; animation-duration:9s; animation-delay:2s;"></span>
    <span style="left:50%; animation-duration:6s; animation-delay:1s;"></span>
    <span style="left:70%; animation-duration:8s; animation-delay:3s;"></span>
    <span style="left:90%; animation-duration:10s; animation-delay:4s;"></span>
  </div>

  <div class="login-card">
    <div class="logo">PRIMEFORM</div>
    <div class="input-box">
      <input type="text" placeholder="Email / Username">
    </div>
    <div class="input-box">
      <input type="password" id="password" placeholder="Password">
      <span class="toggle" onclick="togglePassword()">Show</span>
    </div>
    <button class="btn">Log In</button>

    <div class="divider">OR</div>
    <div class="social-login">
      <button></button>
      <button>G</button>
    </div>

    <div class="links">
      <a href="#">Sign Up</a> | <a href="#">Forgot Password?</a>
    </div>
  </div>

  <script>
    function togglePassword(){
      const pass = document.getElementById("password");
      const toggle = document.querySelector(".toggle");
      if(pass.type === "password"){
        pass.type = "text";
        toggle.innerText = "Hide";
      } else {
        pass.type = "password";
        toggle.innerText = "Show";
      }
    }
  </script>
</body>
</html>