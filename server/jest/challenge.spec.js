jest.mock('../models');
jest.mock('../middlewares/auth-middleware');
jest.mock('../modules/calcProperty');
const challengeCtl = require('../controller/challenge');

jest.mock('../models');
const User = require('../models/user');
const Challenge = require('../models/challenge');
test('recommendChallenge에 정상적인 값 입력시 res.json()이 호출된다.', async () => {
    Challenge.aggregate = jest.fn();
    Challenge.aggregate.mockResolvedValue([{ _id: 1 }, { _id: 2 }]);
    const mockedJson = jest.fn();
    let res = await challengeCtl.recommendChallenge(
        { query: { length: 1 } },
        {
            locals: { user: '' },
            status: () => {
                return { json: mockedJson };
            },
        }
    );
    expect(Challenge.aggregate).toHaveBeenCalledTimes(1);
    expect(mockedJson).toHaveBeenCalledTimes(1);
    expect(mockedJson).toHaveBeenCalledWith({
        challenges: [{ _id: 1 }, { _id: 2 }],
    });
});

test('searchChallenge() 에 정상적인 값 입력시 res.json 이 호출된다.', async () => {
    const mockedLean = jest.fn();
    const mockedJson = jest.fn();
    mockedLean.mockResolvedValue([
        {
            _id: 1,
            startAt: new Date('2022-03-15'),
        },
        {
            _id: 1,
            startAt: new Date('2022-03-10'),
        },
    ]);
    Challenge.find = jest.fn(() => ({ lean: mockedLean }));

    let res = await challengeCtl.searchChallenge(
        {
            query: {
                title: '',
            },
        },
        {
            locals: {
                user: '',
            },
            status: () => {
                return { json: mockedJson };
            },
        }
    );

    expect(mockedJson).toHaveBeenCalledTimes(1);
    expect(mockedJson).toHaveBeenCalledWith({
        challenges: [
            {
                _id: 1,
                startAt: new Date('2022-03-15'),
            },
            {
                _id: 1,
                startAt: new Date('2022-03-10'),
            },
        ],
    });
});

test('getCategoryList()에 정상적인 값 입력시 lean과 res.json 이 한번씩 호출된다.', async () => {
    const mockedLean = jest.fn();
    const mockedJson = jest.fn();
    mockedLean.mockResolvedValue([{ _id: 1 }, { _id: 2 }]);

    Challenge.find = jest.fn(() => ({
        sort: () => ({
            limit: () => ({
                lean: mockedLean,
            }),
        }),
    }));

    let res = await challengeCtl.getCategoryList(
        {
            params: {
                categoryId: '',
            },
            query: {
                length: '',
            },
        },
        {
            locals: {
                user: { userId: '' },
            },
            status: () => {
                return { json: mockedJson };
            },
        }
    );

    expect(mockedLean).toHaveBeenCalledTimes(1);
    expect(mockedJson).toHaveBeenCalledTimes(1);
    expect(mockedJson).toHaveBeenCalledWith({
        challenges: [{ _id: 1 }, { _id: 2 }],
    });
});

//이미 테스트 코드로 검증된 calc 모듈 및 단순 DB 접근만
//하는 로직이라 임시로 잠시 아래 두 케이스는 생략하겠습니다.
//상세조회 API 임시 생략
//챌린지 작성 API 테스트 코드 임시 생략

test('joinChallenge() 정상 작동 시', async () => {
    const mockedJson = jest.fn();
    Challenge.findById = jest.fn();
    Challenge.findById.mockImplementationOnce(() => ({
        lean: jest.fn().mockReturnValue({
            status: 1,
        }),
    }));
    Challenge.findById.mockResolvedValue({
        _id: 1,
        status: 1,
        participants: [1, 2, 4, 5],
    });

    User.findById = jest.fn();
    User.findById.mockResolvedValue({
        participate: [6, 13, 14, 16, 17],
    });
    Challenge.updateOne = jest.fn();
    User.updateOne = jest.fn();

    let res = await challengeCtl.joinChallenge(
        {
            params: {
                challengeId: 3,
            },
        },
        {
            locals: {
                user: { userId: 10 },
            },
            status: () => {
                return { json: mockedJson };
            },
        }
    );

    expect(Challenge.updateOne).toHaveBeenCalledWith(
        {
            _id: 3,
        },
        { $set: { participants: [1, 2, 4, 5, 10] } }
    );
    expect(User.updateOne).toHaveBeenCalledWith(
        {
            _id: 10,
        },
        {
            $set: { participate: [6, 13, 14, 16, 17, 3] },
        }
    );
    expect(mockedJson).toHaveBeenCalledTimes(1);
    expect(mockedJson).toHaveBeenCalledWith({
        message: '참여성공',
    });
});

test('joinCancelChallenge() 정상 작동 시', async () => {
    const mockedJson = jest.fn();
    Challenge.findById = jest.fn();
    Challenge.findById.mockImplementationOnce(() => ({
        lean: jest.fn().mockReturnValue({
            status: 1,
        }),
    }));
    Challenge.findById.mockResolvedValue({
        _id: 1,
        status: 1,
        participants: [1, 2, 4, 5, 10],
    });

    User.findById = jest.fn();
    User.findById.mockResolvedValue({
        participate: [6, 13, 14, 16, 17, 3],
    });
    Challenge.updateOne = jest.fn();
    User.updateOne = jest.fn();

    let res = await challengeCtl.joinCancelChallenge(
        {
            params: {
                challengeId: 3,
            },
        },
        {
            locals: {
                user: { userId: 10 },
            },
            status: () => {
                return { json: mockedJson };
            },
        }
    );

    expect(Challenge.updateOne).toHaveBeenCalledWith(
        {
            _id: 3,
        },
        { $set: { participants: [1, 2, 4, 5] } }
    );
    expect(User.updateOne).toHaveBeenCalledWith(
        {
            _id: 10,
        },
        {
            $set: { participate: [6, 13, 14, 16, 17] },
        }
    );
    expect(mockedJson).toHaveBeenCalledTimes(1);
    expect(mockedJson).toHaveBeenCalledWith({
        message: '참여 취소 성공',
    });
});

test('likeChallenge() 정상 작동 시', async () => {
    const mockedJson = jest.fn();
    User.findById = jest.fn();
    User.findById.mockResolvedValue({
        likes: [6, 13, 14, 16, 17],
    });
    User.updateOne = jest.fn();
    let res = await challengeCtl.likeChallenge(
        {
            params: {
                challengeId: 3,
            },
        },
        {
            locals: {
                user: { userId: 10 },
            },
            status: () => {
                return { json: mockedJson };
            },
        }
    );

    expect(User.updateOne).toHaveBeenCalledWith(
        {
            _id: 10,
        },
        {
            $set: { likes: [6, 13, 14, 16, 17, 3] },
        }
    );
    expect(mockedJson).toHaveBeenCalledTimes(1);
    expect(mockedJson).toHaveBeenCalledWith({
        message: '찜하기 성공',
    });
});

test('likeChallenge() 정상 작동 시 ', async () => {
    const mockedJson = jest.fn();
    User.findById = jest.fn();
    User.findById.mockResolvedValue({
        likes: [6, 13, 14, 16, 17, 3],
    });
    User.updateOne = jest.fn();
    let res = await challengeCtl.likeCancelChallenge(
        {
            params: {
                challengeId: 3,
            },
        },
        {
            locals: {
                user: { userId: 10 },
            },
            status: () => {
                return { json: mockedJson };
            },
        }
    );

    expect(User.updateOne).toHaveBeenCalledWith(
        {
            _id: 10,
        },
        {
            $set: { likes: [6, 13, 14, 16, 17] },
        }
    );
    expect(mockedJson).toHaveBeenCalledTimes(1);
    expect(mockedJson).toHaveBeenCalledWith({
        message: '찜하기 취소 성공',
    });
});