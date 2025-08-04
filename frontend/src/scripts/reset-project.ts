#!/usr/bin/env node

/**
 * This script resets the React Web project to a blank state.
 * It deletes or moves /app, /components, /hooks, /scripts, /constants directories to /app-example based on user input,
 * then creates a new /app directory with React web-friendly index.tsx and _layout.tsx files.
 * After running, you can remove the script and its package.json entry safely.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const root = process.cwd();
const oldDirs = ['app', 'components', 'hooks', 'constants', 'scripts'];
const exampleDir = 'app-example';
const newAppDir = 'app';
const exampleDirPath = path.join(root, exampleDir);
const newAppDirPath = path.join(root, newAppDir);

const indexContent = `import React from 'react';

export default function Index() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>Edit app/index.tsx to edit this screen.</h1>
      <p>Welcome to your React Web app!</p>
    </div>
  );
}
`;

const layoutContent = `import React from 'react';
import { Outlet } from 'react-router-dom';

export default function RootLayout() {
  return (
    <div>
      {/* Common layout components like header or nav can go here */}
      <Outlet />
    </div>
  );
}
`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const moveDirectories = async (userInput: string): Promise<void> => {
  try {
    if (userInput === 'y') {
      await fs.promises.mkdir(exampleDirPath, { recursive: true });
      console.log(`📁 /${exampleDir} directory created.`);
    }

    for (const dir of oldDirs) {
      const oldDirPath = path.join(root, dir);
      if (fs.existsSync(oldDirPath)) {
        if (userInput === 'y') {
          const newDirPath = path.join(root, exampleDir, dir);
          await fs.promises.rename(oldDirPath, newDirPath);
          console.log(`➡️ /${dir} moved to /${exampleDir}/${dir}.`);
        } else {
          await fs.promises.rm(oldDirPath, { recursive: true, force: true });
          console.log(`❌ /${dir} deleted.`);
        }
      } else {
        console.log(`➡️ /${dir} does not exist, skipping.`);
      }
    }

    await fs.promises.mkdir(newAppDirPath, { recursive: true });
    console.log('\n📁 New /app directory created.');

    const indexPath = path.join(newAppDirPath, 'index.tsx');
    await fs.promises.writeFile(indexPath, indexContent);
    console.log('📄 app/index.tsx created.');

    const layoutPath = path.join(newAppDirPath, '_layout.tsx');
    await fs.promises.writeFile(layoutPath, layoutContent);
    console.log('📄 app/_layout.tsx created.');

    console.log('\n✅ Project reset complete. Next steps:');
    console.log(
      `1. Run \`npm start\` or \`yarn start\` to start your development server.\n2. Edit app/index.tsx to edit the main screen.${
        userInput === 'y' ? `\n3. Delete the /${exampleDir} directory when you're done referencing it.` : ''
      }`
    );
  } catch (error) {
    console.error(`❌ Error during script execution: ${(error as Error).message}`);
  } finally {
    rl.close();
  }
};

rl.question(
  'Do you want to move existing files to /app-example instead of deleting them? (Y/n): ',
  (answer) => {
    const userInput = answer.trim().toLowerCase() || 'y';
    if (userInput === 'y' || userInput === 'n') {
      moveDirectories(userInput);
    } else {
      console.log("❌ Invalid input. Please enter 'Y' or 'N'.");
      rl.close();
    }
  }
);