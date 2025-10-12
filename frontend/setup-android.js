import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Setting up Android platform for Capacitor...');

// Create basic Android project structure
const androidDir = path.join(__dirname, 'android');
const appDir = path.join(androidDir, 'app');
const srcDir = path.join(appDir, 'src', 'main');

// Create directories
const dirs = [
  androidDir,
  appDir,
  path.join(appDir, 'src', 'main', 'java', 'com', 'pawfectpal', 'app'),
  path.join(appDir, 'src', 'main', 'res', 'values'),
  path.join(appDir, 'src', 'main', 'res', 'layout'),
  path.join(appDir, 'src', 'main', 'res', 'drawable'),
  path.join(appDir, 'src', 'main', 'res', 'mipmap-hdpi'),
  path.join(appDir, 'src', 'main', 'res', 'mipmap-mdpi'),
  path.join(appDir, 'src', 'main', 'res', 'mipmap-xhdpi'),
  path.join(appDir, 'src', 'main', 'res', 'mipmap-xxhdpi'),
  path.join(appDir, 'src', 'main', 'res', 'mipmap-xxxhdpi'),
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Create build.gradle (app level)
const appBuildGradle = `apply plugin: 'com.android.application'
apply plugin: 'com.capacitor.plugin'

android {
    compileSdkVersion 34
    defaultConfig {
        applicationId "com.pawfectpal.app"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation fileTree(dir: 'libs', include: ['*.jar'])
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}
`;

fs.writeFileSync(path.join(appDir, 'build.gradle'), appBuildGradle);

// Create AndroidManifest.xml
const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.pawfectpal.app">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/AppTheme">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:theme="@style/AppTheme">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>`;

fs.writeFileSync(path.join(srcDir, 'AndroidManifest.xml'), manifest);

// Create strings.xml
const strings = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">PawfectPal</string>
</resources>`;

fs.writeFileSync(path.join(srcDir, 'res', 'values', 'strings.xml'), strings);

// Create MainActivity.java
const mainActivity = `package com.pawfectpal.app;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }
}`;

fs.writeFileSync(path.join(srcDir, 'java', 'com', 'pawfectpal', 'app', 'MainActivity.java'), mainActivity);

// Create activity_main.xml
const activityMain = `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="PawfectPal"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent" />

</androidx.constraintlayout.widget.ConstraintLayout>`;

fs.writeFileSync(path.join(srcDir, 'res', 'layout', 'activity_main.xml'), activityMain);

console.log('Android project structure created successfully!');
console.log('Next steps:');
console.log('1. Open Android Studio');
console.log('2. Open the android folder as a project');
console.log('3. Sync and build the project');
