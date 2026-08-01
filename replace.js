const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/app/pages/**/*.ts');
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  content = content.replace(/this\.campaignService\.getCampaigns\(\{\s*page:\s*1,\s*limit:\s*100\s*\}\)/g, 
                            "this.campaignService.getCampaignOptions()");
  
  content = content.replace(/this\.campaignService\.getCampaigns\(\{\s*page:\s*1,\s*limit:\s*100\s*\},\s*'ACTIVE'\)/g, 
                            "this.campaignService.getCampaignOptions('ACTIVE')");

  content = content.replace(/this\.campaignService\.getCampaigns\(\{\s*page:\s*1,\s*limit:\s*100,\s*orderBy:\s*'startDate:DESC'\s*\},\s*'ACTIVE'\)/g, 
                            "this.campaignService.getCampaignOptions('ACTIVE')");

  if (content !== originalContent) {
    content = content.replace(/this\.campaigns\s*=\s*res\.data\s*\|\|\s*\[\];/g, "this.campaigns = res || [];");
    content = content.replace(/this\.campaigns\s*=\s*res\.data;/g, "this.campaigns = res || [];");
    
    // Regex for .sort((a,b) => { ... })
    content = content.replace(/\.sort\(\(a,\s*b\)\s*=>\s*\{[\s\S]*?return[^;]+;\s*\}\)/g, "");
    
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log('Updated: ' + file);
  }
});
console.log('Total files changed: ' + changedFiles);
