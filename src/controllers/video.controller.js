import { asyncHandler } from "../utils/asyncHandler.js";

import mongoose, {isValidObjectId} from "mongoose"
import { stopWords } from "../utils/helperData.js";

export const getAllVideosByOption = asyncHandler( async(req,res) => {
    const {
        page = 1,
        limit = 10,
        search = "",
        sortBy,
        sortType = "video",
        order,
        userId,
      } = req.query;
})

    // filter video by given filters
    let filters = {isPublished: true};
    if (isValidObjectId(userId))
        filters.owner = new mongoose.Types.ObjectId(userId);

    let pipeline = [
        {
            $match: {
                ...filters,
            },
        },
    ];

    const sort = {};

    // if query is given (MTlnb agr user ne search mai kuch type kiya hai too) filter the videos
  if (search) {
    const queryWords = search
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .split(" ");
    const filteredWords = queryWords.filter(
      (word) => !stopWords.includes(word)
    );

    console.log("search: ", search);
    console.log("filteredWords: ", filteredWords);

    pipeline.push({
      $addFields: {
        titleMatchWordCount: {
          $size: {
            $filter: {
              input: filteredWords,
              as: "word",
              cond: {
                $in: ["$$word", { $split: [{ $toLower: "$title" }, " "] }],
              },
            },
          },
        },
      },
    });

    pipeline.push({
      $addFields: {
        descriptionMatchWordCount: {
          $size: {
            $filter: {
              input: filteredWords,
              as: "word",
              cond: {
                $in: [
                  "$$word",
                  { $split: [{ $toLower: "$description" }, " "] },
                ],
              },
            },
          },
        },
      },
    });

    sort.titleMatchWordCount = -1;
  }


  // sort the documents
  if (sortBy) {
    sort[sortBy] = parseInt(order);
  } else if (!search && !sortBy) {
    sort["createdAt"] = -1;
  }

  pipeline.push({
    $sort: {
      ...sort,
    },
  });