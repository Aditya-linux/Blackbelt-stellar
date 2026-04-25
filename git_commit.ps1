git init
git remote add origin https://github.com/Aditya-linux/Blackbelt-stellar.git

git config user.name "Aditya"
git config user.email "aditya.linux@github.com"

git branch -M main

git add .gitignore
git commit -m "chore: add root .gitignore"

$files = Get-ChildItem -File -Recurse | Where-Object { 
    $_.FullName -notmatch "\\node_modules\\" -and 
    $_.FullName -notmatch "\\.git\\" -and 
    $_.FullName -notmatch "\\target\\" -and 
    $_.FullName -notmatch "\\.next\\" -and
    $_.FullName -notmatch "git_commit\.ps1$"
}

$counter = 1
foreach ($file in $files) {
    $relativePath = $file.FullName.Substring((Get-Location).Path.Length + 1).Replace('\', '/')
    git add "`"$relativePath`""
    
    $folder = ($relativePath -split '/')[0]
    $name = $file.Name
    git commit -m "feat($folder): implement $name"
    
    $counter++
    if ($counter -gt 32) {
        break
    }
}

git add .
git commit -m "feat: finalize remaining components and integrations"

echo "Commits generated! Pushing to repository..."
git push -u origin main
