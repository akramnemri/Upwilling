# A throwaway "fresh VPS" for testing infra/server/scripts on a developer machine (see test-in-container.sh).
# Ubuntu with systemd as PID 1, like a real server. Never deployed anywhere.
ARG UBUNTU_IMAGE=ubuntu:26.04@sha256:c098726dd9b9733f3e885f8de0ef375206a311b0a317eadc40d347b1115fb944
FROM ${UBUNTU_IMAGE}

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
       systemd systemd-sysv dbus openssh-server openssh-client sudo iproute2 \
    && rm -rf /var/lib/apt/lists/*

# systemd stops cleanly on this signal (docker stop).
STOPSIGNAL SIGRTMIN+3
CMD ["/sbin/init"]
