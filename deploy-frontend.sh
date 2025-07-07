#!/bin/bash
# 这是一个为前端项目设计的安全、健壮的部署脚本，它会保留部署历史，以便于回滚。
# 它会在一个临时的目录中克隆现有的部署分支，更新内容，然后创建一个新的提交。

# --- 配置 ---
# 构建产物目录名 (Vite/React项目通常是 'dist')
BUILD_DIR_NAME="dist"
# 部署分支名
BUILD_BRANCH="build"

# --- 脚本开始 ---
echo "开始前端部署流程..."

# 获取脚本执行的原始目录
ORIGINAL_PWD=$(pwd)
# 将所有临时目录都放在项目根目录下的.tmp子目录中，方便管理和清理
TMP_ROOT="$ORIGINAL_PWD/.tmp"
BUILD_OUTPUT_DIR="$ORIGINAL_PWD/$BUILD_DIR_NAME"
TEMP_DIR="$TMP_ROOT/clone"

# 在脚本退出时，无论是成功还是失败，都自动清理整个.tmp目录
trap 'echo "正在清理临时文件..."; rm -rf "$TMP_ROOT"' EXIT ERR SIGINT SIGTERM

# 1. 安装依赖并构建项目
echo "使用 npm 安装依赖..."
npm install
if [ $? -ne 0 ]; then
    echo "npm install 失败。"
    exit 1
fi
echo "使用 npm 构建项目..."
npm run build
if [ $? -ne 0 ]; then
    echo "项目构建失败。"
    exit 1
fi
echo "项目构建成功! 构建产物位于: $BUILD_OUTPUT_DIR"

# 增加一个包含构建元数据的文件，以确保每次构建都有唯一的提交
echo "创建构建元数据文件..."
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
# 获取当前开发分支的commit hash
DEV_COMMIT_HASH=$(git rev-parse HEAD)
DEV_BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
echo "Build Time (UTC): $BUILD_TIME" > "$BUILD_OUTPUT_DIR/build_info.txt"
echo "Source Commit: $DEV_COMMIT_HASH" >> "$BUILD_OUTPUT_DIR/build_info.txt"
echo "Source Branch: $DEV_BRANCH_NAME" >> "$BUILD_OUTPUT_DIR/build_info.txt"

# 2. 清理并创建临时git工作目录
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"
REMOTE_URL=$(git remote get-url origin)

# 3. 克隆或初始化部署分支
# 检查远程是否存在build分支
if git ls-remote --exit-code --heads origin "$BUILD_BRANCH"; then
    echo "远程部署分支 '$BUILD_BRANCH' 已存在，正在克隆..."
    git clone --depth 1 --branch "$BUILD_BRANCH" "$REMOTE_URL" "$TEMP_DIR"
else
    echo "远程部署分支 '$BUILD_BRANCH' 不存在，将创建新分支。"
    cd "$TEMP_DIR"
    git init -b "$BUILD_BRANCH"
    git remote add origin "$REMOTE_URL"
    cd "$ORIGINAL_PWD"
fi

# 4. 更新部署分支内容
cd "$TEMP_DIR"
echo "正在清理旧的部署文件..."
# 安全地删除所有文件和目录，除了.git目录
find . -maxdepth 1 -mindepth 1 ! -name '.git' -exec rm -rf {} +

echo "正在复制新的构建文件..."
# 从绝对路径复制，确保来源正确
cp -R "$BUILD_OUTPUT_DIR"/* .

# 5. 提交并推送
# 切换回安全目录再执行git命令，避免工作目录问题
cd "$ORIGINAL_PWD" 

# 在克隆的仓库中执行git操作
GIT_DIR="$TEMP_DIR/.git"
WORK_TREE="$TEMP_DIR"

if [[ -z $(git --git-dir="$GIT_DIR" --work-tree="$WORK_TREE" status --porcelain) ]]; then
    echo "没有检测到任何变动，无需部署。"
    exit 0 # 正常退出
fi

echo "正在提交新版本..."
git --git-dir="$GIT_DIR" --work-tree="$WORK_TREE" add .
COMMIT_MESSAGE="Build: $(date +'%Y-%m-%d %H:%M:%S')"
git --git-dir="$GIT_DIR" --work-tree="$WORK_TREE" commit -m "$COMMIT_MESSAGE"

echo "正在将新版本推送到远程 origin/$BUILD_BRANCH ..."
# 使用 --force 推送，因为部署分支的历史是线性的，每次都是全新的构建
git --git-dir="$GIT_DIR" --work-tree="$WORK_TREE" push --force origin "$BUILD_BRANCH"

if [ $? -eq 0 ]; then
    echo "成功推送到 origin/$BUILD_BRANCH !"
else
    echo "推送到远程失败。"
    exit 1
fi

echo "前端部署完成！部署历史已保留。" 