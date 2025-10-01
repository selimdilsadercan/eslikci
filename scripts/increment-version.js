const fs = require('fs');
const path = require('path');

// Path to the build.gradle file
const buildGradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');

try {
  // Read the current build.gradle file
  let content = fs.readFileSync(buildGradlePath, 'utf8');
  
  // Find the current versionCode
  const versionCodeMatch = content.match(/versionCode\s+(\d+)/);
  
  if (versionCodeMatch) {
    const currentVersionCode = parseInt(versionCodeMatch[1]);
    const newVersionCode = currentVersionCode + 1;
    
    // Replace the versionCode
    content = content.replace(
      /versionCode\s+\d+/,
      `versionCode ${newVersionCode}`
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(buildGradlePath, content, 'utf8');
    
    console.log(`✅ Version code updated from ${currentVersionCode} to ${newVersionCode}`);
  } else {
    console.error('❌ Could not find versionCode in build.gradle');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error updating version code:', error.message);
  process.exit(1);
}
