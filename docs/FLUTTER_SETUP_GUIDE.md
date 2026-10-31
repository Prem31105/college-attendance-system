# Flutter SDK & Android Development Setup Guide (Windows)

This document provides step-by-step instructions for installing and configuring Flutter SDK, OpenJDK, and the Android SDK on Windows 11.

---

## 1. System Requirements & Current Audit
| Component | Requirement | Current System Status | Action Needed |
| :--- | :--- | :--- | :--- |
| **Operating System** | Windows 10/11 64-bit | Microsoft Windows 11 Home 64-bit | ✅ Satisfied |
| **Git for Windows** | Git 2.x+ | Git 2.52.0.windows.1 | ✅ Satisfied |
| **PowerShell** | PowerShell 5.0+ | PowerShell 5.1 / 7+ | ✅ Satisfied |
| **Flutter SDK** | Flutter 3.24+ | Not found in PATH | ❌ **Install Required** |
| **Dart SDK** | Included with Flutter | Not found in PATH | ❌ Included with Flutter |
| **Java JDK** | OpenJDK 17 or 21 | Not installed | ❌ **Install Required** |
| **Android SDK** | API 34 (Android 14) | Not installed | ❌ **Install Required** |
| **Android Studio** | Latest Stable | Not installed | ❌ **Install Required** |

---

## 2. Step 1: Install Flutter SDK
1. Download the official Flutter SDK stable zip for Windows from:
   `https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.29.0-stable.zip`
2. Extract the archive into a dedicated development directory (do **NOT** install in `C:\Program Files\`):
   Recommended path: `C:\src\flutter` or `D:\src\flutter`
3. Add the `flutter\bin` directory to your User `PATH` environment variable:
   - Press `Win + R`, type `sysdm.cpl`, press Enter.
   - Go to the **Advanced** tab -> click **Environment Variables**.
   - Under **User variables**, select `Path` -> click **Edit** -> click **New**.
   - Enter `C:\src\flutter\bin` (or `D:\src\flutter\bin`).
   - Click **OK** on all dialogs.
4. Open a fresh terminal and verify:
   ```powershell
   flutter --version
   ```

---

## 3. Step 2: Install OpenJDK & Set JAVA_HOME
Flutter requires Java to build Android apps.
1. Download Microsoft Build of OpenJDK 17 or Eclipse Temurin 17:
   `https://learn.microsoft.com/en-us/java/openjdk/download`
2. Run the installer (it typically installs to `C:\Program Files\Eclipse Adoptium\jdk-17...` or `C:\Program Files\Microsoft\jdk-17...`).
3. Set the `JAVA_HOME` environment variable:
   - Variable name: `JAVA_HOME`
   - Variable value: `C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot\` (or your JDK installation path)
4. Add `%JAVA_HOME%\bin` to your `Path` variable.
5. Verify in a new terminal:
   ```powershell
   java --version
   ```

---

## 4. Step 3: Install Android Studio & Android SDK
1. Download and install Android Studio from:
   `https://developer.android.com/studio`
2. During setup, choose standard installation.
3. Once opened, go to **More Actions** -> **SDK Manager** -> **SDK Tools**:
   - Check **Android SDK Command-line Tools (latest)**
   - Check **Android SDK Build-Tools 34** (or latest)
   - Check **Android Emulator**
   - Click **Apply** and wait for download to finish.
4. Set the `ANDROID_HOME` environment variable:
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\<username>\AppData\Local\Android\Sdk`
5. Add platform tools to your `Path`:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\cmdline-tools\latest\bin`
6. Run license acceptance in PowerShell:
   ```powershell
   flutter doctor --android-licenses
   ```
   (Press `y` to accept all licenses).

---

## 5. Step 4: Testing Options (Emulator vs Physical Device)

### Option A: Testing on Physical Android Phone (Fastest & Recommended)
1. On your Android phone, open **Settings** -> **About Phone**.
2. Tap **Build Number** 7 times to enable Developer Options.
3. Go to **Settings** -> **System** -> **Developer Options**:
   - Turn ON **USB Debugging**.
4. Connect phone via USB cable to PC.
5. On the phone, accept the "Allow USB debugging?" dialog.
6. Verify connection in PC terminal:
   ```powershell
   adb devices
   ```

### Option B: Testing on Android Emulator
1. In Android Studio, open **Virtual Device Manager**.
2. Click **Create Device** -> Select **Pixel 7** or **Pixel 8**.
3. Select System Image: **UpsideDownCake (API 34)** or **VanillaIceCream (API 35)**.
4. Click **Finish**, then press the **Play** button to boot the emulator.

---

## 6. Step 5: Verification & Running the Attendance Student App
Once Flutter is installed and recognized:
```powershell
# 1. Verify health of the development environment
flutter doctor -v

# 2. Navigate to student mobile application
cd "D:\flutter attandance\student_mobile"

# 3. Fetch all Dart/Flutter dependencies
flutter pub get

# 4. Run static analyzer (check all 17 screens)
flutter analyze

# 5. Execute widget and attendance validation tests
flutter test

# 6. Launch the app on connected phone or emulator
flutter run
```
