const MailsCampaigns = require("../models/mail-model");

const createMailCampaign = async (req, res) => {
  let session;
  try {
    const {
      loggedInUserEmail,
      CampaignTitle,
      StartDateFilter,
      EmployeesNrFilter,
      JobTitlesFilter,
      IndustriesFilter,
      CompanyNameFilter,
      KeywordsFilter,
      RevenueFilter,
      DepartmentFilter,
      LocationFilter,
      Stages,
      NoHtml,
      RemoveContacts,
      OnlyVerified,
      CustomTracking,
      ABTesting,
      RequestCurrentJob,
      RequestRecentNews,
      RequestCompanyMission,
      BasicWarming,
      AdvancedWarming,
    } = req.body;

    const currentDate = new Date();
    const formattedDate = `${currentDate.getDate()}/${
      currentDate.getMonth() + 1
    }/${currentDate.getFullYear()}`;

    const newMailCampaign = new MailsCampaigns({
      user: loggedInUserEmail,
      date: formattedDate,
      mailCampaignName: CampaignTitle,
      mailCampaignFilters: [
        { StartDate: StartDateFilter },
        { EmployeesNr: EmployeesNrFilter },
        { JobTitles: JobTitlesFilter },
        { Industries: IndustriesFilter },
        { CompanyName: CompanyNameFilter },
        { Keywords: KeywordsFilter },
        { Revenue: RevenueFilter },
        { Department: DepartmentFilter },
        { Location: LocationFilter },
      ],
      mailCampaignSubjectAndMessage: [{ Stages: Stages }],
      mailCampaignOptions: [
        { NoHtml: NoHtml },
        { RemoveContacts: RemoveContacts },
        { OnlyVerified: OnlyVerified },
        { CustomTracking: CustomTracking },
        { ABTesting: ABTesting },
        { RequestCurrentJob: RequestCurrentJob },
        { RequestRecentNews: RequestRecentNews },
        { RequestCompanyMission: RequestCompanyMission },
        { BasicWarming: BasicWarming },
        { AdvancedWarming: AdvancedWarming },
      ],
    });

    session = await MailsCampaigns.startSession();
    session.startTransaction();

    await newMailCampaign.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json({ message: "Mail campaign created successfully" });
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }

    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const fetchMailCampaigns = async (req, res) => {
  try {
    const mailCampaigns = await MailsCampaigns.find();

    if (!mailCampaigns) {
      return res.status(404).json({ message: "Campaigns data not found" });
    }

    return res.status(200).json(mailCampaigns);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const fetchMailCampaignsByID = async (req, res) => {
  try {
    if (req.params._id) {
      const mailCampaign = await MailsCampaigns.findById(req.params._id);

      if (!mailCampaign) {
        return res.status(404).json({ message: "Mail campaign not found" });
      }

      return res.status(200).json(mailCampaign);
    }

    const mailCampaigns = await MailsCampaigns.find();

    if (!mailCampaigns || mailCampaigns.length === 0) {
      return res
        .status(404)
        .json({ message: "Data for mail campaigns not found" });
    }

    return res.status(200).json(mailCampaigns);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteMailCampaignByID = async (req, res) => {
  try {
    const mailCampaign = await MailsCampaigns.findByIdAndDelete(req.params._id);

    if (!mailCampaign) {
      return res.status(404).json({ message: "Mail campaign not found" });
    }

    return res
      .status(200)
      .json({ message: "Mail campaign deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const editMailCampaignByID = async (req, res) => {
  try {
    const campaignID = req.params._id;
    const updatedMailCampaignData = req.body;

    const updatedMailCampaign = await MailsCampaigns.findOneAndUpdate(
      { _id: campaignID },
      {
        $set: {
          status: updatedMailCampaignData.status,
          mailCampaignName: updatedMailCampaignData.CampaignTitle,
          "mailCampaignFilters.0.StartDate":
            updatedMailCampaignData.StartDateFilter,
          "mailCampaignFilters.1.EmployeesNr":
            updatedMailCampaignData.EmployeesNrFilter,
          "mailCampaignFilters.2.JobTitles":
            updatedMailCampaignData.JobTitlesFilter,
          "mailCampaignFilters.3.Industries":
            updatedMailCampaignData.IndustriesFilter,
          "mailCampaignFilters.4.CompanyName":
            updatedMailCampaignData.CompanyNameFilter,
          "mailCampaignFilters.5.Keywords":
            updatedMailCampaignData.KeywordsFilter,
          "mailCampaignFilters.6.Revenue":
            updatedMailCampaignData.RevenueFilter,
          "mailCampaignFilters.7.Department":
            updatedMailCampaignData.DepartmentFilter,
          "mailCampaignFilters.8.Location":
            updatedMailCampaignData.LocationFilter,
          "mailCampaignSubjectAndMessage.0.Stages":
            updatedMailCampaignData.Stages,
          "mailCampaignOptions.0.NoHtml": updatedMailCampaignData.NoHtml,
          "mailCampaignOptions.1.RemoveContacts":
            updatedMailCampaignData.RemoveContacts,
          "mailCampaignOptions.2.OnlyVerified":
            updatedMailCampaignData.OnlyVerified,
          "mailCampaignOptions.3.CustomTracking":
            updatedMailCampaignData.CustomTracking,
          "mailCampaignOptions.4.ABTesting": updatedMailCampaignData.ABTesting,
          "mailCampaignOptions.5.RequestCurrentJob":
            updatedMailCampaignData.RequestCurrentJob,
          "mailCampaignOptions.6.RequestRecentNews":
            updatedMailCampaignData.RequestRecentNews,
          "mailCampaignOptions.7.RequestCompanyMission":
            updatedMailCampaignData.RequestCompanyMission,
          "mailCampaignOptions.8.BasicWarming":
            updatedMailCampaignData.BasicWarming,
          "mailCampaignOptions.9.AdvancedWarming":
            updatedMailCampaignData.AdvancedWarming,
        },
      },
      { new: true }
    );

    if (!updatedMailCampaign) {
      return res
        .status(404)
        .json({ message: "Campaña de correo no encontrada" });
    }

    res.json(updatedMailCampaign);
  } catch (error) {
    console.error("Error al editar la campaña de correo:", error);
    res.status(500).json({ error: "Error al editar la campaña de correo" });
  }
};

module.exports = {
  createMailCampaign,
  fetchMailCampaigns,
  fetchMailCampaignsByID,
  deleteMailCampaignByID,
  editMailCampaignByID,
};
