const moment = require('moment');
const Proofshot = require('../models/proofShot');

module.exports = {
    //status 계산
    calcStatus: (challenges) => {
        for (const i of challenges) {
            const start = i.startAt;
            const cur = new Date().toLocaleDateString();
            const end = new Date(cur);
            const dateDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
            if (dateDiff < 0) {
                i.status = 1; //시작 전
            } else if (dateDiff > 30) {
                i.status = 2; //완료
            } else {
                i.status = 0; //진행중
            }
        }
    },

    //참여자 수 계산
    calcParticipants: (challenges) => {
        for (const i of challenges) {
            i.participants = i.participants.length;
        }
    },

    //총 인증횟수 계산 await
    calcProofCnt: async (challenges, user) => {
        for (const i of challenges) {
            let challengeId = i._id;
            let proofCount = await Proofshot.count({ challengeId, userId: user.userId });
            i.proofCount = proofCount;
        }
    },

    //경과 날짜, round 계산
    calcPastDaysAndRound: (challenges) => {
        let today = moment().format('YYYY-MM-DD'); //2022-03-05 00:00:00
        for (const i of challenges) {
            let pastDays =
                (moment(today) - moment(moment(i.startAt).format('YYYY-MM-DD'))) /
                (1000 * 60 * 60 * 24);
            i.pastDays = pastDays;
            i.round = Math.floor(pastDays / 3) + 1;
        }
    },

    //금일 업로드 체크 await
    calcIsUpload: async (challenges) => {
        let today = moment().format('YYYY-MM-DD'); //2022-03-05 00:00:00
        for (const i of challenges) {
            //금일 인증 여부
            if (
                await Proofshot.findOne({
                    challengeId: i._id,
                    createdAt: {
                        $gte: new Date(today).toISOString(),
                        $lt: new Date(moment(today).add(1, 'days')).toISOString(),
                    },
                })
            ) {
                i.isUpload = true;
            } else i.isUpload = false;
        }
    },
};
