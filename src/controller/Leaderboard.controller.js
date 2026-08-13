import  TestResult from "../model/TestResult.model.js"
import {getRedisClient , isRedisConnected} from "../../config/redis.js"

// cache config
const CACHE_TTL = 60*5;
const CACHE_PREFIX ='leaderboard';

  //build cache key based on filters
const buildCacheKey = (duration, limit) => {
  if (duration) {
    return `${CACHE_PREFIX}:duration:${duration}:limit:${limit}`;
  }
  return `${CACHE_PREFIX}:all:limit:${limit}`;
};

async function HandleLeaderBoard(req,res) {

   try {
    const duration = parseInt(req.query.duration) || null;
    const limit = parseInt(req.query.limit) || 10;

    // check redis cache first
      const redis    = getRedisClient();
    const cacheKey = buildCacheKey(duration, limit);

     if (isRedisConnected() && redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.status(200).json({
          ...JSON.parse(cached),
          fromCache: true,
        });
      }
    }

 // if cache miss run the mongo aggregation
    // for the guest user 
    const matchStage= {
        userId: {$ne:null},
    }

     if (duration) {
      matchStage.duration = duration * 60; // convert minutes to seconds

    }

     const leaderboard = await TestResult.aggregate([
      //  filter results
      { $match: matchStage},
      

      //  sort by wpm highest first
      { $sort: { wpm: -1 } },

      //  group by user — keep only their best score
      {
        $group: {
          _id      : '$userId',
          bestWpm  : { $first: '$wpm' },
          accuracy : { $first: '$accuracy' },
          duration : { $first: '$duration' },
          resultId : { $first: '$_id' },
          createdAt: { $first: '$createdAt' },
        },
      },

      //  sort grouped results by bestWpm again
      { $sort: { bestWpm: -1 } },

      //  limit results
      { $limit: limit },

      //join with User collection to get username
      {
        $lookup: {
          from        : 'users',
          localField  : '_id',
          foreignField: '_id',
          as          : 'user',
        },
      },

      // flatten user array into single object
      { $unwind: '$user' },

      // add inclusion
      {
        $addFields:{
                 userId  : '$_id',
          username: '$user.username',
          avatar  : '$user.avatar',
        }
      },

      //  shape the final output 
      {
        $project: {
          _id : 0,
          user: 0,
        },
      },
    ]);


     // Add rank number to each result
    const ranked = leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

     const response = {
      success    : true,
      duration   : duration ? `${duration} min` : 'all',
      total      : ranked.length,
      leaderboard: ranked,
      fromCache  : false,
    };

      if (isRedisConnected() && redis) {
      await redis.set(
        cacheKey,
        JSON.stringify(response),
        'EX',
        CACHE_TTL
      );
    }


    res.status(200).json(response);


   } catch (error) {
    return res.status(500).json({success:false, message:error.message})
    
   }
    
}

export default HandleLeaderBoard
