const LinkedInCampaigns = require("../models/linkedin-model");

const createLinkedInCampaign = async (req, res) => {
  try {
    const {
      loggedInUserEmail,
      CampaignTitle,
      CurrentCompanyNameFilter,
      CompanyHeadcountFilter,
      PastCompanyNameFilter,
      CompanyTypeFilter,
      CompanyHQLocationFilter,
      RoleFunctionFilter,
      CurrentJobTitleFilter,
      SeniorityLevelFilter,
      PastJobTitleFilter,
      YearsInCurrentCompanyFilter,
      YearsInCurrentPositionFilter,
      GeographyFilter,
      IndustryFilter,
      FirstNameFilter,
      LastNameFilter,
      ProfileLanguageFilter,
      YearsOfExperienceFilter,
      GroupsFilter,
      SchoolFilter,
      ChangedJobsFilter,
      PostedOnLinkedInFilter,
      Subject,
      Message,
      Variant,
    } = req.body;

    const currentDate = new Date();
    const formattedDate = `${currentDate.getDate()}/${
      currentDate.getMonth() + 1
    }/${currentDate.getFullYear()}`;

    const newLinkedInCampaign = new LinkedInCampaigns({
      user: loggedInUserEmail,
      date: formattedDate,
      linkedInCampaignName: CampaignTitle,
      linkedInCampaignFilters: [
        { CurrentCompanyName: CurrentCompanyNameFilter },
        { CompanyHeadcount: CompanyHeadcountFilter },
        { PastCompanyName: PastCompanyNameFilter },
        { CompanyType: CompanyTypeFilter },
        { CompanyHQLocation: CompanyHQLocationFilter },
        { RoleFunction: RoleFunctionFilter },
        { CurrentJobTitle: CurrentJobTitleFilter },
        { SeniorityLevel: SeniorityLevelFilter },
        { PastJobTitle: PastJobTitleFilter },
        { YearsInCurrentCompany: YearsInCurrentCompanyFilter },
        { YearsInCurrentPosition: YearsInCurrentPositionFilter },
        { Geography: GeographyFilter },
        { Industry: IndustryFilter },
        { FirstName: FirstNameFilter },
        { LastName: LastNameFilter },
        { ProfileLanguage: ProfileLanguageFilter },
        { YearsOfExperience: YearsOfExperienceFilter },
        { Groups: GroupsFilter },
        { School: SchoolFilter },
        { ChangedJobs: ChangedJobsFilter },
        { PostedOnLinkedIn: PostedOnLinkedInFilter },
      ],
      linkedInCampaignSubjectAndMessage: [
        { Subject: Subject },
        { Message: Message },
        { Variant: Variant },
      ],
    });

    const session = await LinkedInCampaigns.startSession();
    session.startTransaction();

    await newLinkedInCampaign.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json({ message: "LinkedIn campaign created successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const fetchLinkedInCampaigns = async (req, res) => {
  try {
    const linkedInCampaigns = await LinkedInCampaigns.find();

    if (!linkedInCampaigns) {
      return res.status(404).json({ message: "Campaigns data not found" });
    }

    return res.status(200).json(linkedInCampaigns);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const fetchLinkedInCampaignsByID = async (req, res) => {
  try {
    if (req.params._id) {
      const linkedInCampaign = await LinkedInCampaigns.findById(req.params._id);

      if (!linkedInCampaign) {
        return res.status(404).json({ message: "LinkedIn campaign not found" });
      }

      return res.status(200).json(linkedInCampaign);
    }

    const linkedInCampaigns = await LinkedInCampaigns.find();

    if (!linkedInCampaigns || linkedInCampaigns.length === 0) {
      return res
        .status(404)
        .json({ message: "Data for LinkedIn campaigns not found" });
    }

    return res.status(200).json(linkedInCampaigns);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteLinkedInCampaignByID = async (req, res) => {
  try {
    const linkedInCampaign = await LinkedInCampaigns.findByIdAndDelete(
      req.params._id
    );

    if (!linkedInCampaign) {
      return res.status(404).json({ message: "LinkedIn campaign not found" });
    }

    return res
      .status(200)
      .json({ message: "LinkedIn campaign deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const editLinkedInCampaignByID = async (req, res) => {
  try {
    const campaignID = req.params._id;
    const updatedLinkedInCampaignData = req.body;

    const updatedLinkedInCampaign = await LinkedInCampaigns.findOneAndUpdate(
      { _id: campaignID },
      {
        $set: {
          linkedInCampaignName: updatedLinkedInCampaignData.CampaignTitle,
          "linkedInCampaignFilters.0.CurrentCompanyName":
            updatedLinkedInCampaignData.CurrentCompanyNameFilter,
          "linkedInCampaignFilters.1.CompanyHeadcount":
            updatedLinkedInCampaignData.CompanyHeadcountFilter,
          "linkedInCampaignFilters.2.PastCompanyName":
            updatedLinkedInCampaignData.PastCompanyNameFilter,
          "linkedInCampaignFilters.3.CompanyType":
            updatedLinkedInCampaignData.CompanyTypeFilter,
          "linkedInCampaignFilters.4.CompanyHQLocation":
            updatedLinkedInCampaignData.CompanyHQLocationFilter,
          "linkedInCampaignFilters.5.RoleFunction":
            updatedLinkedInCampaignData.RoleFunctionFilter,
          "linkedInCampaignFilters.6.CurrentJobTitle":
            updatedLinkedInCampaignData.CurrentJobTitleFilter,
          "linkedInCampaignFilters.7.SeniorityLevel":
            updatedLinkedInCampaignData.SeniorityLevelFilter,
          "linkedInCampaignFilters.8.PastJobTitle":
            updatedLinkedInCampaignData.PastJobTitleFilter,
          "linkedInCampaignFilters.9.YearsInCurrentCompany":
            updatedLinkedInCampaignData.YearsInCurrentCompanyFilter,
          "linkedInCampaignFilters.10.YearsInCurrentPosition":
            updatedLinkedInCampaignData.YearsInCurrentPositionFilter,
          "linkedInCampaignFilters.11.Geography":
            updatedLinkedInCampaignData.GeographyFilter,
          "linkedInCampaignFilters.12.Industry":
            updatedLinkedInCampaignData.IndustryFilter,
          "linkedInCampaignFilters.13.FirstName":
            updatedLinkedInCampaignData.FirstNameFilter,
          "linkedInCampaignFilters.14.LastName":
            updatedLinkedInCampaignData.LastNameFilter,
          "linkedInCampaignFilters.15.ProfileLanguage":
            updatedLinkedInCampaignData.ProfileLanguageFilter,
          "linkedInCampaignFilters.16.YearsOfExperience":
            updatedLinkedInCampaignData.YearsOfExperienceFilter,
          "linkedInCampaignFilters.17.Groups":
            updatedLinkedInCampaignData.GroupsFilter,
          "linkedInCampaignFilters.18.School":
            updatedLinkedInCampaignData.SchoolFilter,
          "linkedInCampaignFilters.19.ChangedJobs":
            updatedLinkedInCampaignData.ChangedJobsFilter,
          "linkedInCampaignFilters.20.PostedOnLinkedIn":
            updatedLinkedInCampaignData.PostedOnLinkedInFilter,
          "linkedInCampaignSubjectAndMessage.0.Subject":
            updatedLinkedInCampaignData.SubjectFilter,
          "linkedInCampaignSubjectAndMessage.1.Message":
            updatedLinkedInCampaignData.Message,
          "linkedInCampaignSubjectAndMessage.2.Variant":
            updatedLinkedInCampaignData.Variant,
          status: updatedLinkedInCampaignData.status,
        },
      },
      { new: true }
    );

    if (!updatedLinkedInCampaign) {
      return res
        .status(404)
        .json({ message: "Campaña de correo no encontrada" });
    }

    res.json(updatedLinkedInCampaign);
  } catch (error) {
    console.error("Error al editar la campaña de correo:", error);
    res.status(500).json({ error: "Error al editar la campaña de correo" });
  }
};

module.exports = {
  createLinkedInCampaign,
  fetchLinkedInCampaigns,
  fetchLinkedInCampaignsByID,
  deleteLinkedInCampaignByID,
  editLinkedInCampaignByID,
};
