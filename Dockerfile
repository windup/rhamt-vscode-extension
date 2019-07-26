# ---------------------------------------------------------------------------------------------
#  Copyright (c) Red Hat. All rights reserved.
#  Licensed under the MIT License. See License.txt in the project root for license information.
# ---------------------------------------------------------------------------------------------

FROM eclipse/che-remote-plugin-runner-java11/7.0.0-next

RUN apk add --no-cache bash

ENV RHAMT_VERSION=4.2.0-SNAPSHOT \
    RHAMT_ROOT=$HOME/rhamt
   
ENV RHAMT_HOME=${RHAMT_ROOT}/rhamt-cli-${RHAMT_VERSION}
ENV PATH=${PATH}:${RHAMT_HOME}/bin

RUN mkdir -p $HOME/rhamt

ADD rhamt-cli-${RHAMT_VERSION}-offline.zip ${RHAMT_ROOT}/rhamt-cli-${RHAMT_VERSION}-offline.zip

RUN unzip -d ${RHAMT_ROOT} ${RHAMT_ROOT}/rhamt-cli-${RHAMT_VERSION}-offline.zip && \
    rm -f ${RHAMT_ROOT}/rhamt-cli-${RHAMT_VERSION}-offline.zip

