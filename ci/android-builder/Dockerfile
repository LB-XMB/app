# Pre-baked Android builder for Forgejo release jobs.
# Skips apt/JDK/sdkmanager downloads on every tag (~3–8 min saved).
#
# Build on the runner host (once, or when SDK/NDK pins change):
#   ./ci/android-builder/build.sh
#
# Image tag must match ANDROID_BUILDER_IMAGE in .forgejo/workflows/release.yml
FROM node:22-bookworm

ENV DEBIAN_FRONTEND=noninteractive \
    ANDROID_HOME=/opt/android-sdk \
    ANDROID_SDK_ROOT=/opt/android-sdk \
    JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 \
    PATH=/opt/android-sdk/cmdline-tools/latest/bin:/opt/android-sdk/platform-tools:/usr/lib/jvm/java-17-openjdk-amd64/bin:$PATH

# Pins must stay in sync with React Native / Expo (see release.yml history).
ARG CMDLINE_TOOLS_ZIP=commandlinetools-linux-13114758_latest.zip
ARG ANDROID_PLATFORM=android-36
ARG ANDROID_BUILD_TOOLS=36.0.0
ARG ANDROID_NDK=27.1.12297006
ARG ANDROID_CMAKE=3.30.5

RUN apt-get update -qq \
    && apt-get install -y -qq --no-install-recommends \
        openjdk-17-jdk-headless \
        unzip \
        curl \
        ca-certificates \
        git \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p "$ANDROID_HOME/cmdline-tools" \
    && curl -fsSL -o /tmp/cmdline-tools.zip \
        "https://dl.google.com/android/repository/${CMDLINE_TOOLS_ZIP}" \
    && unzip -q /tmp/cmdline-tools.zip -d "$ANDROID_HOME/cmdline-tools" \
    && mv "$ANDROID_HOME/cmdline-tools/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest" \
    && rm -f /tmp/cmdline-tools.zip \
    && yes | sdkmanager --licenses >/dev/null \
    && sdkmanager \
        "platform-tools" \
        "platforms;${ANDROID_PLATFORM}" \
        "build-tools;${ANDROID_BUILD_TOOLS}" \
        "ndk;${ANDROID_NDK}" \
        "cmake;${ANDROID_CMAKE}" \
    && rm -rf /root/.android/cache /tmp/*

# Smoke-check the toolchain used at sign time.
RUN java -version \
    && node -v \
    && test -x "$ANDROID_HOME/build-tools/${ANDROID_BUILD_TOOLS}/apksigner" \
    && test -d "$ANDROID_HOME/ndk/${ANDROID_NDK}"

WORKDIR /workspace
